# News Mania 2.0 - Global News Hub

## Overview
News Mania is a modern news aggregator web application that fetches and displays news articles from various categories. The application features a clean, responsive design with dark mode support, news categorization, search functionality, and AI-powered article summarization using Google's Gemini API.

## Features
- Browse news articles by category (General, Technology, Business, Sports, Entertainment, Science)
- Search for specific news topics
- Dark mode toggle
- Article summarization using Gemini AI
- Interactive quiz feature for articles
- Bookmark articles for later reading
- Share articles
- Service Worker for offline functionality
- Responsive design for mobile and desktop

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js with Express
- **APIs**: 
  - NewsAPI for fetching news articles
  - Google Gemini API for article summarization
- **Caching**: Node-Cache for API response caching
- **PWA**: Service Worker for offline support

## Project Structure
```
.
├── server.js           # Express server handling API routes
├── index.html          # Main HTML file
├── script.js           # Frontend JavaScript logic
├── styles.css          # Styling (embedded in HTML)
├── service-worker.js   # Service worker for PWA
├── manifest.json       # Web app manifest
├── package.json        # Node.js dependencies
└── .env               # Environment variables (API keys)
```

## Environment Variables
The application requires the following environment variables:
- `NEWS_API_KEY`: API key from NewsAPI.org
- `GEMINI_API_KEY`: Google Gemini API key
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)

## Development Setup
The application is configured to run on Replit with the following setup:

### Server Configuration
- **Host**: 0.0.0.0 (required for Replit)
- **Port**: 5000
- **Static Files**: Served from root and public directories

### Running the Application
The application is configured with a workflow that automatically starts the server:
```bash
PORT=5000 npm start
```

## API Endpoints
- `GET /` - Serves the main application
- `GET /health` - Health check endpoint
- `GET /test-api-key` - Validates NewsAPI key
- `GET /api/news?category={category}&country={country}` - Fetches news articles
- `GET /api/categories` - Lists available news categories
- `POST /api/summarize` - Generates AI summary of article text

## Deployment
The application is configured for Replit deployment with:
- **Type**: Autoscale (stateless web application)
- **Run Command**: `node server.js`

## Recent Changes (Replit Setup)
- Added .gitignore to protect sensitive files
- Updated server to bind to 0.0.0.0:5000 for Replit compatibility
- Changed frontend API calls from hardcoded localhost:3001 to relative URLs
- Configured workflow to run server on port 5000
- Added deployment configuration for autoscale deployment
- Created project documentation

## Notes
- The application uses caching (5 minutes TTL) to reduce API calls
- NewsAPI has rate limits; consider this when testing
- Service worker is registered for offline functionality
- Images may fail to load due to CORS policies from external sources
