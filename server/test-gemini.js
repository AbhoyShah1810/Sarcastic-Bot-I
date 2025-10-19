require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
        console.log('API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try different model names
        const models = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-pro', 'gemini-1.0-pro'];
        
        for (const modelName of models) {
            try {
                console.log(`\nTrying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, respond with just 'test'");
                console.log(`✅ ${modelName} works! Response:`, result.response.text());
                break; // If one works, we're done
            } catch (error) {
                console.log(`❌ ${modelName} failed:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('General error:', error);
    }
}

testGemini();
