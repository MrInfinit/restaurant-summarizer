const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const port = 3000;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  try {
    // In a real application, you would first scrape reviews from various sources.
    // For this example, we'll use some dummy review data.
    const reviews = `
      - "The food at ${restaurantName} was absolutely amazing! Best pasta I've ever had."
      - "Great atmosphere and friendly staff, but the food was a bit overpriced for the quality."
      - "A wonderful experience from start to finish. The service was impeccable and the desserts are to die for."
      - "I had a reservation but still had to wait 30 minutes. The main course was cold."
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const prompt = `Summarize the following reviews for the restaurant "${restaurantName}":\n\n${reviews}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    res.json({ summary: summary });
  } catch (error) {
    console.error('Error generating summary with Gemini:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});