const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getJson } = require("serpapi");
require('dotenv').config();

const app = express();
const port = 3000;

// Initialize the clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const serpApiKey = process.env.SERPAPI_API_KEY;

app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Helper function to get reviews from multiple sources
async function getReviewSnippets(restaurantName, location) {
  const sources = [
    { query: `${restaurantName} reviews site:yelp.com`, source: "Yelp" },
    { query: `${restaurantName} reviews ${location} site:reddit.com`, source: "Reddit" },
    { query: `${restaurantName} ${location} google reviews`, source: "Google" }
  ];

  const reviews = {};
  for (const { query, source } of sources) {
    const search = await getJson({
      api_key: serpApiKey,
      engine: "google",
      q: query,
      location: "United States",
      num: 3 // Limit to 3 results per source
    });
    
    if (search.organic_results) {
      reviews[source] = search.organic_results
        .slice(0, 2)
        .map(r => r.snippet)
        .join("\n");
    }
  }
  return reviews;
}

app.get('/summarize', async (req, res) => {
  const restaurantQuery = req.query.restaurant;
  const { lat, lon } = req.query;

  if (!restaurantQuery) {
    return res.status(400).json({ error: 'Restaurant name is required' });
  }
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }
  if (!serpApiKey || serpApiKey === "YOUR_SERPAPI_API_KEY_HERE") {
    console.error("SerpApi API key is missing or not configured.");
    return res.status(500).json({ error: 'SerpApi API key is not configured on the server.' });
  }

  try {
    // Define the model ONCE at the top of the try block
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Step 1: Analyze the user's query to determine the search term and type
    console.log(`Step 1: Analyzing query: "${restaurantQuery}"`);
    const analysisPrompt = `
      Analyze the following user query for a restaurant search. Determine if the user is looking for a specific restaurant chain or a general food category.
      - If it's a specific chain (e.g., "Chipotle", "Starbucks near me"), the type is "restaurant" and the search term should be the core name of the chain.
      - If it's a food category (e.g., "pizza", "best burgers in SF"), the type is "category" and the search term should be the original query.

      Respond with ONLY a valid JSON object in the format: {"type": "restaurant" | "category", "search_term": "..."}

      Query: "${restaurantQuery}"
    `;
    const analysisResult = await model.generateContent(analysisPrompt);
    const analysisText = (await analysisResult.response).text().trim();
    console.log(`Received analysis: ${analysisText}`);

    let analysis;
    try {
      // The model sometimes wraps the JSON in markdown, so we clean it.
      const cleanedJson = analysisText.replace(/^```json\n/, '').replace(/\n```$/, '');
      analysis = JSON.parse(cleanedJson);
    } catch (e) {
      console.error("Failed to parse JSON from model:", analysisText);
      return res.status(500).json({ error: "Sorry, I couldn't understand that request." });
    }

    const { type: queryType, search_term: search_q } = analysis;
    console.log(`Query classified as: ${queryType}, with search term: "${search_q}"`);

    // Step 2: Find different locations/restaurants based on the analysis
    console.log(`Step 2: Finding locations for "${search_q}" near ${lat},${lon}...`);
    const locationSearch = await getJson({
      api_key: serpApiKey,
      engine: "google_maps",
      q: search_q,
      ll: `@${lat},${lon},15z`,
      type: "search",
    });

    const locations = locationSearch.local_results?.slice(0, 2) || [];
    if (locations.length < 2) {
      return res.status(404).json({ summary: `Could not find at least two different "${search_q}" options near you to compare.` });
    }

    const location1 = locations[0];
    const location2 = locations[1];

    // Step 3: Gather review data for each location
    console.log(`Step 3: Gathering reviews for "${location1.title}" and "${location2.title}"...`);
    const location1Reviews = await getReviewSnippets(location1.title, location1.address);
    const location2Reviews = await getReviewSnippets(location2.title, location2.address);

    // Step 4: Build the advanced comparison prompt
    console.log("Step 4: Building advanced comparison prompt for Gemini...");
    const comparisonSubject = queryType === 'restaurant' ? search_q : `best ${search_q}`;
    const comparisonPrompt = `
      You are a concise and direct restaurant comparison expert. Compare these two options based on reviews from Yelp, Reddit, and Google for "${comparisonSubject}".

      **${location1.title}**
      Location: ${location1.address}
      Reviews from multiple sources:
      ${Object.entries(location1Reviews).map(([source, reviews]) => `${source}:\n${reviews}`).join('\n\n')}

      **${location2.title}**
      Location: ${location2.address}
      Reviews from multiple sources:
      ${Object.entries(location2Reviews).map(([source, reviews]) => `${source}:\n${reviews}`).join('\n\n')}

      Provide an extremely concise analysis focusing only on the most important factors:
      1. Create a brief bullet list of key strengths and weaknesses for each option
      2. Make a clear recommendation in 1-2 sentences maximum

      Format as HTML. Use <h3> for titles, <ul> and <li> for lists. Keep everything short and to the point. Avoid unnecessary words or redundant information.
    `;

    // Step 5: Generate the final analysis
    const finalResult = await model.generateContent(comparisonPrompt);
    let summary = (await finalResult.response).text();

    // Clean the summary to remove markdown code block fences
    summary = summary.replace(/^```html\n/, '').replace(/\n```$/, '').trim();

    console.log("Generated Comparison:", summary);
    res.json({ summary: summary });

  } catch (error) {
    console.error('Error during summarization process:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});