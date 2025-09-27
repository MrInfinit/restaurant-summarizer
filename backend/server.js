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

app.get('/summarize', async (req, res) => {
  const restaurantName = req.query.restaurant;

  if (!restaurantName) {
    return res.status(400).json({ error: 'Restaurant name is required' });
  }
  if (!serpApiKey || serpApiKey === "YOUR_SERPAPI_API_KEY_HERE") {
    console.error("SerpApi API key is missing or not configured.");
    return res.status(500).json({ error: 'SerpApi API key is not configured on the server.' });
  }

  try {
    // 1. Perform a web search for the restaurant to gather information
    console.log(`Performing web search for: ${restaurantName} using SerpApi...`);
    const searchResults = await getJson({
      api_key: serpApiKey,
      engine: "google",
      q: `${restaurantName} reviews`,
      location: "United States",
    });

    // 2. Extract relevant text from the search results
    let searchContext = "";
    if (searchResults.organic_results) {
      // Get snippets from the top 5 results
      searchContext = searchResults.organic_results.slice(0, 5).map(result => result.snippet).join("\n");
    }
    if (searchResults.knowledge_graph && searchResults.knowledge_graph.description) {
      searchContext = searchResults.knowledge_graph.description + "\n" + searchContext;
    }

    if (!searchContext) {
      return res.status(404).json({ error: `Could not find any web results for "${restaurantName}".` });
    }

    // 3. Use the search results to generate a summary with Gemini
    console.log("Generating summary with Gemini based on web results...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Based on the following web search results, provide a concise summary for the restaurant "${restaurantName}". Focus on food, service, and ambiance. Do not mention the search results directly in your summary.\n\nSEARCH RESULTS:\n${searchContext}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log("Generated Summary:", summary);
    res.json({ summary: summary });

  } catch (error) {
    console.error('Error during summarization process:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});