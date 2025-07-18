const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

// Constants
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/top-headlines';
const API_KEY = process.env.NEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use(express.static('public'));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

// Test API key route
app.get('/test-api-key', async (req, res) => {
    try {
        const response = await axios.get(`${NEWS_API_BASE_URL}?country=us&apiKey=${API_KEY}`);
        res.status(200).json({ status: 'API key is valid' });
    } catch (error) {
        res.status(400).json({ status: 'API key is invalid', error: error.message });
    }
});

// News API route
app.get('/api/news', async (req, res) => {
    try {
        const { country = 'us', category = 'general' } = req.query;
        const cacheKey = `news_${country}_${category}`;

        // Check cache first
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        // If not in cache, fetch from API
        const response = await axios.get(NEWS_API_BASE_URL, {
            params: {
                country,
                category,
                apiKey: API_KEY
            }
        });

        // Cache the result
        cache.set(cacheKey, response.data);

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Categories route
app.get('/api/categories', (req, res) => {
    const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
    res.json(categories);
});

// Gemini API route for summarization
app.post('/api/summarize', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'No text provided for summarization' });
        }

        // Clean the text by removing [+chars] patterns
        const cleanedText = text.replace(/\[\+\d+ chars\]/g, '');

        // Call Gemini API for summarization
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: `Summarize the following news article in 3-4 sentences. Make it concise and informative:\n\n${cleanedText}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 500,
                    topP: 0.8,
                    topK: 40
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Extract the summary text from Gemini response
        const summaryText = response.data.candidates[0].content.parts[0].text;
        
        res.json({ summary: summaryText });
    } catch (error) {
        console.error('Error generating summary:', error.response?.data || error.message);
        
        const originalText = req.body.text;
        
        // Fallback: Use a simpler extractive summarization approach
        try {
            // Simple extractive summarization as fallback
            const sentences = originalText.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
            const numSentences = Math.min(3, sentences.length);
            let fallbackSummary = sentences.slice(0, numSentences).join('. ');
            
            // Add period at the end if needed
            if (fallbackSummary && !fallbackSummary.endsWith('.')) {
                fallbackSummary += '.';
            }
            
            if (!fallbackSummary) {
                fallbackSummary = 'Unable to generate summary due to limited content. Please refer to the original article.';
            }
            
            res.json({ summary: fallbackSummary });
        } catch (fallbackError) {
            console.error('Fallback summarization also failed:', fallbackError);
            res.status(500).json({ error: 'Failed to generate summary' });
        }
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Key status: ${API_KEY ? 'configured' : 'missing'}`);
    console.log('Available endpoints:');
    console.log('- GET /health');
    console.log('- GET /test-api-key');
    console.log('- GET /api/news');
    console.log('- GET /api/categories');
});