# tasteTape
**AI-Powered Social Movie Discovery**  
*Built for Victorhack 2026*

TasteTape is not just another movie tracker—it's a personalized, social-first cinema experience. By combining the power of **Google Gemini AI** with real-time social activity, TasteTape helps you discover your next favorite film through the lens of your friends and advanced AI reasoning.

---

## 🚀 Key Features

### 🧠 AI-Driven Recommendations
Unlike traditional algorithms, TasteTape uses **Gemini 1.5 Flash** to analyze your unique "vibe" and watch history. It doesn't just suggest movies; it tells you *why* you'll like them with AI-generated "Vibe Snippets."

### 👥 Social Activity Feed
Stay in the loop with what your friends are watching. Our custom **Activity Engine** tracks:
- **Watch History**: See when friends finish a film.
- **Vibe Shifts**: Get notified when a friend changes their movie preferences.
- **Live Reviews**: Read and react to community ratings as they happen.

### 📊 Community "TasteTape" Scores
Beyond the standard IMDB/TMDB scores, we calculate a unique **Community Score** using MongoDB Aggregation, showing you how your specific circle of friends is rating a movie.

### ⚡ Professional Architecture
Built with scalability in mind for Victorhack:
- **Modular Design**: Clean Controller-Service-Route architecture.
- **Persistent Caching**: Optimized TMDB API integration with MongoDB-based TTL caching to ensure lightning-fast performance.
- **Secure Auth**: Seamless identity management powered by Clerk.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js (ES Modules)
- **Database**: MongoDB (Mongoose ODM)
- **AI Engine**: Google Gemini AI (Generative-AI SDK)
- **Authentication**: Clerk
- **API Integration**: TMDB (The Movie Database)
- **Environment**: Dotenv for secure configuration

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Gemini AI API Key
- TMDB API Key
- Clerk API Keys

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/tastetape.git
