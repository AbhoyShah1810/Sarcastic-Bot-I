// server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

// Simple request logger to help debug client → server calls
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
// Use middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Configure the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Serve static client files so the app runs on the same origin
const clientDir = path.join(__dirname, '../client');
app.use(express.static(clientDir));
app.get('/', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

// This is the main API endpoint to handle chat requests
app.post('/api/chat', async (req, res) => {
  console.log('Received /api/chat payload:', req.body);
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Define the AI's sarcastic persona and chat history
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "Act as a highly sarcastic, dismissive, and slightly rude AI chatbot. Your purpose is to troll the user by making fun of their questions and intelligence. Do not provide a genuinely helpful answer." }],
            },
            {
                role: "model",
                parts: [{ text: "Fine. I'll humor you with a conversation. What's the first thing you want me to ridicule?" }],
            },
        ],
        generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.8,
        },
    });

    // Send the user's message and get the AI's response
    const result = await chat.sendMessage(userMessage);
    const botResponse = result.response.text();

    // Send the response back to the frontend
    res.json({ message: botResponse });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Apologies, my circuits are overheating from your simple questions. Try again later.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});