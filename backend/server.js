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

// Helper function to get search snippets for a specific location
async function getReviewSnippets(query) {
  const search = await getJson({
    api_key: serpApiKey,
    engine: "google",
    q: query,
    location: "United States",
  });
  if (!search.organic_results) return "No information found.";
  return search.organic_results.slice(0, 4).map(r => r.snippet).join("\n");
}

app.get('/summarize', async (req, res) => {
  const restaurantQuery = req.query.restaurant;

  if (!restaurantQuery) {
    return res.status(400).json({ error: 'Restaurant name is required' });
  }
  if (!serpApiKey || serpApiKey === "YOUR_SERPAPI_API_KEY_HERE") {
    console.error("SerpApi API key is missing or not configured.");
    return res.status(500).json({ error: 'SerpApi API key is not configured on the server.' });
  }

  try {
    // Define the model ONCE at the top of the try block
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Step 1: Identify the core restaurant chain name
    console.log(`Step 1: Identifying core restaurant name from "${restaurantQuery}"...`);
    const chainNamePrompt = `Extract the core restaurant chain name from the following query: "${restaurantQuery}". For example, if the query is "Chipotle on 5th Ave", the answer is "Chipotle". Respond with only the name.`;
    const chainNameResult = await model.generateContent(chainNamePrompt);
    const chainName = (await chainNameResult.response).text().trim();
    console.log(`Identified chain: "${chainName}"`);

    // Step 2: Find different locations for that chain
    console.log(`Step 2: Finding locations for "${chainName}" near "${restaurantQuery}"...`);
    const locationSearch = await getJson({
      api_key: serpApiKey,
      engine: "google_maps", // Use Google Maps engine for better location data
      q: `${chainName} near ${restaurantQuery}`,
      type: "search",
    });

    const locations = locationSearch.local_results?.slice(0, 2) || [];
    if (locations.length < 2) {
      return res.status(404).json({ summary: `Could not find at least two different "${chainName}" locations near your search to compare.` });
    }

    const location1 = locations[0];
    const location2 = locations[1];

    // Step 3: Gather review data for each location
    console.log(`Step 3: Gathering reviews for "${location1.title}" and "${location2.title}"...`);
    const location1Reviews = await getReviewSnippets(`${location1.title} reviews`);
    const location2Reviews = await getReviewSnippets(`${location2.title} reviews`);

    // Step 4: Build the advanced comparison prompt
    console.log("Step 4: Building advanced comparison prompt for Gemini...");
    const comparisonPrompt = `
      You are a helpful local guide. A user wants to know which of two locations of the same restaurant chain is better.

      Here is the data I have gathered:

      **Location 1: ${location1.title}**
      Address: ${location1.address}
      Review Snippets:
      ${location1Reviews}

      **Location 2: ${location2.title}**
      Address: ${location2.address}
      Review Snippets:
      ${location2Reviews}

      Your task is to compare these two locations. Analyze the review snippets for each, looking for clues about service speed, cleanliness, order accuracy, crowd levels, or staff friendliness.

      First, provide a separate "Pros and Cons" list for each location based on the reviews.
      Second, provide a final "Recommendation" on which location seems like the better choice and why.

      Format your entire response as an HTML document. Use <h3> for titles, <ul> and <li> for lists, <strong> for emphasis, and <p> for paragraphs.
    `;

    // Step 5: Generate the final analysis
    const finalResult = await model.generateContent(comparisonPrompt);
    const summary = (await finalResult.response).text();

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