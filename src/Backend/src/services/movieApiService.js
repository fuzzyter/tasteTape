import dotenv from 'dotenv';
import { cacheService } from './cacheService.js';
dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const fetchFromTMDB = async (endpoint, params = '') => {
    const cacheKey = `${endpoint}${params}`;
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
        console.log(`📡 Returning cached data for: ${endpoint}`);
        return cachedData;
    }

    const apiKey = process.env.TMDB_API_KEY;
    const url = `${TMDB_BASE_URL}${endpoint}?api_key=${apiKey}${params}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB API Error: ${response.status}`);

    const data = await response.json();
    cacheService.set(cacheKey, data);

    return data;
};

export const fetchTrending = (timeframe = 'week') =>
    fetchFromTMDB(`/trending/movie/${timeframe}`);

export const fetchMovie = (id) =>
    fetchFromTMDB(`/movie/${id}`);

export const searchMovies = (query) =>
    fetchFromTMDB('/search/movie', `&query=${encodeURIComponent(query)}`);

export const fetchSimilar = (id) =>
    fetchFromTMDB(`/movie/${id}/similar`);
