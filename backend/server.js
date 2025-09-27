const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.json());

// Add CORS middleware to allow requests from the extension
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

  // In a real application, you would:
  // 1. Search for reviews from multiple sources (Google, Yelp, etc.)
  // 2. Pass the reviews to an AI service (ChatGPT, Gemini) for summarization.

  // For this example, we'll return a placeholder summary.
  const placeholderSummary = `
    <h3>Summary for ${restaurantName}</h3>
    <p><strong>Overall:</strong> This is a fantastic restaurant with a great atmosphere.</p>
    <ul>
      <li><strong>Food:</strong> Customers rave about the delicious and innovative dishes. The steak is a must-try.</li>
      <li><strong>Service:</strong> The staff is friendly, attentive, and knowledgeable.</li>
      <li><strong>Ambiance:</strong> The decor is modern and stylish, making it a great place for a special occasion.</li>
    </ul>
    <p><em>(This is a placeholder summary. A real implementation would use an AI service to generate a summary from multiple review sources.)</em></p>
  `;

  res.json({ summary: placeholderSummary });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});