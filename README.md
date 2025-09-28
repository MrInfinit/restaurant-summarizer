# ReviewFinder

## Overview

ReviewFinder is a Chrome extension designed to enhance restaurant selection by aggregating and analyzing reviews from multiple authoritative sources. Utilizing artificial intelligence, it provides comprehensive, data-driven summaries to facilitate informed dining decisions.

![ReviewFinder Banner](extension/banner.png)

## Core Features

- Multi-source Review Integration
  - Google Reviews integration
  - Yelp review analysis
  - Reddit discussion incorporation
- Advanced AI Analysis
  - Powered by Google's Gemini API
  - Intelligent review summarization
  - Context-aware comparisons
- Location-based Functionality
  - Proximity-aware restaurant analysis
  - Comparative analysis of nearby establishments
  - Distance-based filtering (10-mile radius)
- User Experience
  - Streamlined information presentation
  - Objective comparison metrics
  - Clear, actionable insights

## System Requirements and Installation

### Prerequisites
- Node.js (Version 14.0.0 or higher)
- Google Chrome Browser
- Required API Credentials:
  - Google Gemini API Access Token
  - SerpAPI Authentication Key

### Backend Configuration

1. Repository Initialization:
```bash
git clone https://github.com/yourusername/restaurant-summarizer.git
cd restaurant-summarizer/backend
```

2. Dependency Installation:
```bash
npm install
```

3. Environment Configuration:
Create a configuration file named `.env` in the backend directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SERPAPI_API_KEY=your_serpapi_api_key_here
```

4. Server Initialization:
```bash
npm start
```

### Extension Deployment

1. Access Chrome Extensions: Navigate to `chrome://extensions/`
2. Enable Development Mode: Activate via top-right toggle
3. Load Extension: Select "Load unpacked" and navigate to the `extension` directory

## Implementation Guide

1. Navigate to Google search engine
2. Input desired restaurant or cuisine query
3. Access ReviewFinder via the Chrome extension icon
4. Initiate review analysis via the "Get Reviews" function
5. Review the generated analysis, including location comparisons when applicable

## Technical Architecture

The system operates through a sequential process:

1. Query Processing
   - Search query extraction
   - Geolocation data acquisition
   - Parameter validation

2. Data Aggregation
   - Multi-source review retrieval via SerpAPI
   - Structured data normalization
   - Geographic proximity analysis

3. Analysis Pipeline
   - Review content processing
   - Comparative analysis generation
   - Location-based filtering
   - Summary synthesis

4. Data Presentation
   - Structured format generation
   - Response optimization
   - User interface rendering

## Technical Stack

### Frontend Architecture
- Core Technologies
  - HTML5/CSS3
  - JavaScript (ES6+)
  - Chrome Extension Framework

### Backend Infrastructure
- Server Environment
  - Node.js Runtime
  - Express.js Framework
- Integration Services
  - Google Gemini AI Platform
  - SerpAPI Integration Layer

## Development Contribution Protocol

1. Repository Forking
2. Development Branch Creation (`git checkout -b feature/FeatureIdentifier`)
3. Code Implementation and Commit (`git commit -m 'Implementation: FeatureIdentifier'`)
4. Branch Synchronization (`git push origin feature/FeatureIdentifier`)
5. Pull Request Submission

## Licensing Information

This software is distributed under the MIT License. Reference the [LICENSE](LICENSE) file for complete terms and conditions.

## Technical Acknowledgments

- Google Gemini API: Advanced natural language processing capabilities
- SerpAPI: Comprehensive review data aggregation services
- Chrome Extension Framework: Browser integration infrastructure