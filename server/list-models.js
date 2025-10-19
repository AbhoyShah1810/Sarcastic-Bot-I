require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
        console.log('API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // List available models
        const models = await genAI.listModels();
        console.log('\nAvailable models:');
        models.forEach(model => {
            console.log(`- ${model.name}`);
        });
        
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();

