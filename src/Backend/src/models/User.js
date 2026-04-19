import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  watchedMovies: [Number], // Array of TMDB IDs
  preferences: [String],   // Array of "vibes" or genres
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
