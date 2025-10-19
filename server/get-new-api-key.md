# How to Get a New Gemini API Key

## Step 1: Get a New API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. **Sign in with a DIFFERENT Google account** (or create a new one)
3. Click "Get API Key"
4. Create a new API key
5. Copy the API key (it will look like `AIzaSy...`)

## Step 2: Update Your .env File
Replace the API key in your `.env` file:

```bash
# Edit the .env file
nano .env

# Replace the first line with your new API key:
GEMINI_API_KEY=your_new_api_key_here
```

## Step 3: Test the API Key
```bash
# Test if the new API key works
curl http://localhost:3000/api/test-key
```

## Step 4: Restart the Server
```bash
# Restart the server to use the new API key
pkill -f "node server.js"
npm start
```

## What Happens Now:
- ✅ **With working API key**: Bot uses real LLM thinking and generates unique responses
- ⚠️ **With quota exceeded**: Bot falls back to enhanced sarcastic responses
- 🔄 **Automatic fallback**: System tries LLM first, then uses backup responses

## Benefits of Real LLM:
- **Independent thinking**: AI analyzes and responds naturally
- **Context awareness**: Remembers conversation history
- **Dynamic responses**: Never repeats the same response
- **Natural conversation**: Flows like talking to a real person
- **Sarcastic personality**: Maintains the troll-like character

Your bot will automatically use the LLM when the API key works, and fall back to the enhanced responses when it doesn't!

