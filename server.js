const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// Constants
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/top-headlines';
const API_KEY = process.env.NEWS_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
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