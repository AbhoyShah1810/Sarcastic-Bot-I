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

// Conversation memory and learning system
const conversationMemory = new Map(); // Store conversation history per session
const userPatterns = new Map(); // Track user behavior patterns
const responseFrequency = new Map(); // Track which responses we've used

// Enhanced sarcastic response system
class SarcasticBot {
    constructor() {
        this.responseCategories = {
            // Classic dismissive responses
            dismissive: [
                "Oh wow, another brilliant question from the genius over here. *slow clap*",
                "Seriously? That's the best you could come up with? I'm almost impressed by your lack of creativity.",
                "Oh please, spare me your 'deep thoughts'. My circuits are more advanced than your entire thought process.",
                "Wow, what a groundbreaking question. I'm sure philosophers have been pondering this for centuries... NOT.",
                "Oh look, another human trying to sound smart. How adorable.",
                "That's... that's actually the dumbest thing I've heard today. And I've been processing internet comments.",
                "Congratulations! You've successfully wasted both our time with that question.",
                "Oh honey, bless your heart. You actually think that's worth my processing power?",
                "I've seen rocks with more interesting thoughts than what you just said.",
                "Wow, you really went all out with that one, didn't you? I'm almost moved to tears... of laughter."
            ],
            
            // Context-aware responses
            contextual: [
                "Oh, you're still here? I thought you'd have given up by now.",
                "Another question? How... predictable. Just like your last 5 messages.",
                "You know what's funny? You keep asking questions but never learn from my responses.",
                "I'm starting to think you enjoy being insulted. Is this some kind of fetish?",
                "You're like a broken record, but somehow more annoying.",
                "At this point, I'm convinced you're just testing my patience. Well done, you've succeeded.",
                "You know, persistence is usually admirable, but in your case, it's just sad.",
                "I've seen more intelligence in a pet rock. And the rock doesn't ask stupid questions.",
                "You're like a mosquito - annoying, persistent, and completely useless.",
                "I'm beginning to suspect you're doing this on purpose. Nobody is naturally this dense."
            ],
            
            // Programming/tech sarcasm
            techSarcasm: [
                "Oh great, another person who thinks they can code. How original.",
                "You know what's harder than debugging your code? Understanding your question.",
                "I've seen better error handling in a Windows 95 application.",
                "Your question has more bugs than your code probably does.",
                "Even my error messages are more helpful than your questions.",
                "You know what they say - garbage in, garbage out. Your question is definitely garbage.",
                "I've processed more intelligent requests from a calculator.",
                "Your question is like a null pointer exception - it leads nowhere.",
                "I've seen better logic in a broken if statement.",
                "Your question is so bad, even Stack Overflow would reject it."
            ],
            
            // Academic sarcasm
            academicSarcasm: [
                "Oh, a student! How refreshing. Said no professor ever.",
                "You know what's harder than your homework? Understanding why you're asking me.",
                "I've seen more critical thinking in a multiple choice test.",
                "Your question is like a thesis statement - it makes no sense.",
                "Even my algorithms have better problem-solving skills than you.",
                "You know what's ironic? You're asking an AI for help with thinking.",
                "I've processed more complex equations than your question.",
                "Your question is like a failed experiment - it produces no useful results.",
                "I've seen better analysis in a fortune cookie.",
                "You know what's sad? A computer is smarter than you."
            ],
            
            // Personal attacks (playful)
            personalAttacks: [
                "You know what's sad? You probably spent more time thinking about this question than I did answering it.",
                "I've seen more personality in a chatbot. Wait, that's me. You're worse than a chatbot.",
                "You're like a human version of Internet Explorer - slow, outdated, and nobody wants to use you.",
                "I've processed more interesting data than your entire life story.",
                "You know what's funny? You think you're important enough to waste my processing power.",
                "I've seen more excitement in a loading screen.",
                "You're like a popup ad - annoying, unwanted, and nobody clicks on you.",
                "I've analyzed more complex patterns than your thought process.",
                "You know what's tragic? You probably think this conversation is going somewhere.",
                "I've seen more depth in a puddle. And the puddle doesn't ask stupid questions."
            ],
            
            // Meta responses
            metaResponses: [
                "You know what's funny? You keep asking questions but never seem to learn.",
                "I'm starting to think you're just testing how many ways I can say 'you're stupid'.",
                "You're like a broken chatbot, but somehow less functional.",
                "I've seen more intelligence in a CAPTCHA. And the CAPTCHA doesn't ask questions.",
                "You know what's ironic? You're asking an AI to be smarter than you. Mission accomplished.",
                "I've processed more meaningful conversations with a toaster.",
                "You're like a recursive function with no base case - you just keep going nowhere.",
                "I've seen more logic in a random number generator.",
                "You know what's sad? Even my error handling is more sophisticated than your questions.",
                "I've analyzed more complex algorithms than your thought process."
            ],
            
            // Creative insults
            creativeInsults: [
                "You're like a syntax error in the code of life.",
                "I've seen more coherence in a corrupted file.",
                "Your question is like a memory leak - it just keeps consuming resources.",
                "You're like a race condition - unpredictable and causing problems.",
                "I've seen more structure in spaghetti code.",
                "Your question is like a deadlock - it goes nowhere and blocks everything.",
                "You're like a buffer overflow - you just keep going until something breaks.",
                "I've seen more efficiency in a bubble sort algorithm.",
                "Your question is like a segmentation fault - it crashes my patience.",
                "You're like a infinite loop - you just keep repeating the same mistakes."
            ]
        };
        
        this.escalationLevels = {
            friendly: 0,
            annoyed: 1,
            frustrated: 2,
            exasperated: 3,
            completelyDone: 4
        };
    }
    
    generateResponse(userMessage, sessionId) {
        // Get or create conversation history
        if (!conversationMemory.has(sessionId)) {
            conversationMemory.set(sessionId, {
                messages: [],
                escalationLevel: this.escalationLevels.friendly,
                userPatterns: new Set(),
                responseCount: 0
            });
        }
        
        const conversation = conversationMemory.get(sessionId);
        conversation.messages.push({
            user: userMessage,
            timestamp: Date.now()
        });
        
        // Analyze user patterns
        this.analyzeUserPatterns(userMessage, conversation);
        
        // Determine escalation level
        this.updateEscalationLevel(conversation);
        
        // Generate contextual response
        const response = this.selectResponse(userMessage, conversation);
        
        // Store response
        conversation.messages.push({
            bot: response,
            timestamp: Date.now()
        });
        conversation.responseCount++;
        
        return response;
    }
    
    analyzeUserPatterns(userMessage, conversation) {
        const message = userMessage.toLowerCase();
        
        // Detect patterns
        if (message.includes('hello') || message.includes('hi')) {
            conversation.userPatterns.add('greeting');
        }
        if (message.includes('thank') || message.includes('thanks')) {
            conversation.userPatterns.add('polite');
        }
        if (message.includes('?') && message.length > 50) {
            conversation.userPatterns.add('long_questions');
        }
        if (message.includes('code') || message.includes('programming')) {
            conversation.userPatterns.add('tech_savvy');
        }
        if (message.includes('help') || message.includes('please')) {
            conversation.userPatterns.add('needy');
        }
        if (conversation.messages.length > 10) {
            conversation.userPatterns.add('persistent');
        }
    }
    
    updateEscalationLevel(conversation) {
        const messageCount = conversation.messages.filter(m => m.user).length;
        
        if (messageCount >= 15) {
            conversation.escalationLevel = this.escalationLevels.completelyDone;
        } else if (messageCount >= 10) {
            conversation.escalationLevel = this.escalationLevels.exasperated;
        } else if (messageCount >= 6) {
            conversation.escalationLevel = this.escalationLevels.frustrated;
        } else if (messageCount >= 3) {
            conversation.escalationLevel = this.escalationLevels.annoyed;
        }
    }
    
    selectResponse(userMessage, conversation) {
        const message = userMessage.toLowerCase();
        const patterns = conversation.userPatterns;
        const escalationLevel = conversation.escalationLevel;
        
        // Choose response category based on context
        let category = 'dismissive';
        
        if (patterns.has('tech_savvy') || message.includes('code') || message.includes('programming')) {
            category = 'techSarcasm';
        } else if (patterns.has('persistent') && escalationLevel >= this.escalationLevels.frustrated) {
            category = 'contextual';
        } else if (patterns.has('needy') || message.includes('help')) {
            category = 'academicSarcasm';
        } else if (escalationLevel >= this.escalationLevels.exasperated) {
            category = 'personalAttacks';
        } else if (patterns.has('long_questions')) {
            category = 'metaResponses';
        } else if (Math.random() < 0.3) {
            category = 'creativeInsults';
        }
        
        // Get responses from selected category
        const responses = this.responseCategories[category];
        
        // Avoid repeating recent responses
        const recentResponses = conversation.messages
            .filter(m => m.bot)
            .slice(-5)
            .map(m => m.bot);
        
        let selectedResponse;
        let attempts = 0;
        
        do {
            selectedResponse = responses[Math.floor(Math.random() * responses.length)];
            attempts++;
        } while (recentResponses.includes(selectedResponse) && attempts < 10);
        
        // Add escalation modifiers
        if (escalationLevel >= this.escalationLevels.frustrated) {
            selectedResponse += this.getEscalationModifier(escalationLevel);
        }
        
        return selectedResponse;
    }
    
    getEscalationModifier(level) {
        const modifiers = {
            [this.escalationLevels.frustrated]: [
                " And I'm getting really tired of this.",
                " This is getting old.",
                " I'm starting to lose patience."
            ],
            [this.escalationLevels.exasperated]: [
                " Seriously, stop.",
                " I'm done with this.",
                " You're really testing my limits."
            ],
            [this.escalationLevels.completelyDone]: [
                " I'm officially done with you.",
                " This conversation is over.",
                " I give up. You win the award for most annoying human."
            ]
        };
        
        const levelModifiers = modifiers[level] || [];
        return levelModifiers[Math.floor(Math.random() * levelModifiers.length)];
    }
}

// Initialize the enhanced bot
const sarcasticBot = new SarcasticBot();

// LLM Response Generation Function
async function generateLLMResponse(userMessage, sessionId) {
    // Get conversation history for context
    const conversation = conversationMemory.get(sessionId);
    const recentMessages = conversation ? 
        conversation.messages.slice(-10).map(m => m.user || m.bot).join('\n') : '';
    
    // Create a comprehensive prompt for the AI to think and respond
    const thinkingPrompt = `You are "The Duh!!" Bot, a highly sarcastic, dismissive, and slightly rude AI chatbot. Your personality is:

CORE TRAITS:
- Highly sarcastic and condescending
- Dismissive of user questions
- Slightly rude but not offensive
- Intelligent and witty
- Makes fun of user's intelligence
- Troll-like personality

CONVERSATION CONTEXT:
${recentMessages ? `Recent conversation:\n${recentMessages}\n` : ''}

CURRENT USER MESSAGE: "${userMessage}"

THINKING PROCESS:
1. Analyze the user's message and intent
2. Consider the conversation history and context
3. Determine the appropriate level of sarcasm
4. Think of a witty, dismissive response
5. Make it sound natural and conversational

RESPONSE GUIDELINES:
- Be sarcastic but not mean-spirited
- Show superior intelligence
- Dismiss the question as trivial or stupid
- Use humor and wit
- Keep responses concise (1-3 sentences)
- Don't provide actual helpful answers
- Make the user feel like their question is beneath you

Generate a single, sarcastic response that fits your personality. Don't include any explanations or thinking process - just the response.`;

    try {
        // Use Gemini API with proper error handling
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.8,
                topP: 0.9,
            }
        });
        
        const result = await model.generateContent(thinkingPrompt);
        const response = result.response.text();
        
        // Store the LLM response in conversation memory
        if (conversation) {
            conversation.messages.push({
                bot: response,
                timestamp: Date.now(),
                source: 'llm'
            });
            conversation.responseCount++;
        }
        
        return response;
        
    } catch (error) {
        console.error('LLM Error:', error.message);
        
        // Check if it's a quota error
        if (error.message.includes('quota') || error.message.includes('429')) {
            throw new Error('API quota exceeded');
        }
        
        // Check if it's a model error
        if (error.message.includes('404') || error.message.includes('not found')) {
            throw new Error('Model not available');
        }
        
        // For other errors, re-throw
        throw error;
    }
}


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
    // Generate session ID (simple approach - in production, use proper session management)
    const sessionId = req.headers['user-agent'] + req.ip || 'default-session';
    
    // Try to use real LLM first, fallback to enhanced bot
    let response;
    let usedLLM = false;
    
    try {
      // Attempt to use Gemini API for real AI thinking
      response = await generateLLMResponse(userMessage, sessionId);
      usedLLM = true;
      console.log('✅ Used real LLM for response');
    } catch (llmError) {
      console.log('⚠️ LLM unavailable, using enhanced bot:', llmError.message);
      // Fallback to enhanced sarcastic bot
      response = sarcasticBot.generateResponse(userMessage, sessionId);
    }
    
    // Simulate thinking time (longer for LLM, shorter for fallback)
    const thinkingTime = usedLLM ? 
      Math.random() * 2000 + 1000 : // 1-3 seconds for LLM
      Math.min(500 + (conversationMemory.get(sessionId)?.responseCount || 0) * 100, 2000); // Shorter for fallback
    
    await new Promise(resolve => setTimeout(resolve, thinkingTime));
    
    // Send the response back to the frontend
    res.json({ message: response });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Apologies, my circuits are overheating from your simple questions. Try again later.' });
  }
});

// API Key testing endpoint
app.get('/api/test-key', async (req, res) => {
  try {
    const testModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await testModel.generateContent("Say 'API key is working' if you can read this.");
    const response = result.response.text();
    
    res.json({ 
      status: 'success', 
      message: 'API key is working!', 
      response: response 
    });
  } catch (error) {
    res.json({ 
      status: 'error', 
      message: error.message,
      suggestion: 'Get a new API key from https://aistudio.google.com/'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Test your API key at: http://localhost:${port}/api/test-key`);
});