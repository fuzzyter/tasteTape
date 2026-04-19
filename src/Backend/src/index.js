import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Services
import * as movieApi from './services/movieApiService.js';
import * as activityService from './services/activityService.js';

// Routes
import recommendationRoutes from './routes/recommendations.js';
import friendRoutes from './routes/friends.js';
import authRoutes from './routes/auth.js';
import reviewRoutes from './routes/reviews.js';
import ratingRoutes from './routes/rating.js';
import userRoutes from './routes/users.js';
import movieRoutes from './routes/movie.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tastetape')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB connection failed:', err));

// Routes
app.get('/', (req, res) => {
  res.send('TasteTape AI Backend (src version) is running!');
});

app.use('/api/recommendations', recommendationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/movies', movieRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`✓ TasteTape Backend running on http://localhost:${PORT}`);
});
