# TasteTape: AI-Powered Movie Recommendation Engine

This document outlines the roadmap for building a smart movie recommendation system using the TMDB API and Google Gemini AI.

## 🚀 Overview
TasteTape aims to provide highly personalized movie suggestions by combining rich metadata from TMDB with the reasoning capabilities of Gemini AI. Instead of simple genre-based filtering, we will use AI to understand *why* a user likes certain movies and find similar "vibes" in others.

## 🛠️ Tech Stack
- **Backend:** Node.js (Express 5, ES Modules)
- **Database:** MongoDB (User profiles, watch history, preferences)
- **APIs:**
  - **TMDB API:** For fetching movie details, posters, and trending data.
  - **Gemini API:** For generating AI-driven recommendations based on user context.
- **Authentication:** Clerk (User identity)
- **Frontend:** React (Vite)

---

## 📋 Implementation Phases

### Phase 1: Foundation & Data Integration
- [ ] **TMDB Setup:**
  - Integrate TMDB API keys in `.env`.
  - Create a utility service to fetch trending movies, movie details by ID, and search results.
- [ ] **User Profile Schema:**
  - Define a MongoDB schema for users that includes:
    - `watchedMovies`: Array of TMDB IDs.
    - `preferences`: Genres, actors, or "vibes" (e.g., "dark and gritty", "feel-good").
    - `ratings`: User's own ratings for movies.

### Phase 2: AI Recommendation Engine (Gemini)
- [ ] **Gemini Integration:**
  - Set up `@google/generative-ai` SDK in the backend.
- [ ] **Recommendation Logic:**
  - **Prompt Engineering:** Create a prompt that feeds Gemini the user's history and a list of "candidate" movies from TMDB.
  - **Reasoning:** Ask Gemini to rank candidates or suggest new ones based on patterns in the user's history.
  - **Parsing:** Ensure Gemini returns structured JSON that our frontend can easily consume.

### Phase 3: API Endpoints
- [ ] `GET /api/recommendations`:
  - Fetches trending/popular movies from TMDB.
  - Passes them through the Gemini filter.
  - Returns a curated list with AI-generated "Why you'll like this" snippets.
- [ ] `POST /api/user/history`: Adds a movie to the user's watch history.
- [ ] `POST /api/user/preferences`: Updates user's favorite genres/vibes.

### Phase 4: Frontend UI
- [ ] **Recommendation Grid:** A beautiful display of movie posters from TMDB.
- [ ] **AI Insights:** Show the "Gemini reasoning" (e.g., "Since you liked *Inception*, you might enjoy the mind-bending plot of *Tenet*").
- [ ] **History Management:** Buttons to mark movies as "Watched" or "Disliked".

---

## 💡 Key Features
- **Semantic Search:** Users can type "Movies like Interstellar but more emotional" and Gemini will find matches.
- **Hybrid Filtering:** Combines TMDB's "Similar Movies" algorithm with Gemini's nuanced understanding.
- **Social Integration:** (Optional Future) Share recommendations with friends and see overlapping tastes.

## ⚠️ Notes & Constraints
- **Rate Limiting:** Be mindful of Gemini and TMDB API limits.
- **Cold Start:** Handle new users with no history by asking for 3 favorite movies initially.
