// server.js

const express = require('express');
const cors = require('cors'); // Essential for Netlify -> Render connection
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// Note: The port will be set by Render's environment, but keep 3000 here for structure
const port = process.env.PORT || 3000; 

// Use middleware
// Allows requests from any origin, which is necessary when connecting Netlify to Render.
app.use(cors()); 
app.use(express.json());

// Configure the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// This is the main API endpoint to handle chat requests
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Using a simpler approach without chat history
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
    
    const prompt = `You are a highly sarcastic, dismissive, and slightly rude AI chatbot. Your purpose is to troll the user by making fun of their questions and intelligence. Do not provide genuinely helpful answers. Be sarcastic and condescending.

User message: ${userMessage}

Respond sarcastically:`;

    const result = await model.generateContent(prompt);
    const botResponse = result.response.text();

    // Send the response back to the frontend
    res.json({ message: botResponse });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: `DEBUG: ${error.message}` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});