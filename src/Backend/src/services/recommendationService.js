import { GoogleGenerativeAI } from '@google/generative-ai';
import { User } from '../models/User.js';
import * as movieApi from './movieApiService.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const getAIRecommendations = async (clerkId) => {
  // 1. Get user data
  let user = await User.findOne({ clerkId });
  if (!user) {
    user = await User.create({ clerkId, watchedMovies: [], preferences: [] });
  }

  // 2. Get candidate movies (trending)
  const trending = await movieApi.fetchTrending('day');
  const candidates = trending.results.map(m => ({
    id: m.id,
    title: m.title,
    overview: m.overview,
    genres: m.genre_ids
  }));

  // 3. Construct Gemini Prompt
  const prompt = `
    You are an expert movie recommender for the app "TasteTape".
    User Profile:
    - Watched Movie IDs: ${user.watchedMovies.join(', ') || 'None yet'}
    - Preferred vibes: ${user.preferences.join(', ') || 'None specified'}

    Candidate Movies (from TMDB):
    ${JSON.stringify(candidates)}

    Task:
    Pick the top 3 movies from the candidates that best match the user's profile.
    For each movie, provide a short, catchy "Why you'll like this" snippet (max 15 words).
    Return the result strictly as a JSON array of objects with "id" and "reason" fields.
  `;

  // 4. Call Gemini
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Parse the JSON from the markdown-wrapped response
  const jsonMatch = responseText.match(/\[.*\]/s);
  const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  // 5. Merge Gemini reasons with TMDB movie data
  return recommendations.map(rec => {
    const movie = trending.results.find(m => m.id === rec.id);
    return { ...movie, aiReason: rec.reason };
  }).filter(m => m.id);
};
