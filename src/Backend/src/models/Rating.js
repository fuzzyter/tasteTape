import mongoose from 'mongoose';

const quickRatingSchema = new mongoose.Schema({
  movieId: { type: Number, required: true },
  clerkId: { type: String, required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a user can only have one quick rating per movie
quickRatingSchema.index({ movieId: 1, clerkId: 1 }, { unique: true });

export const Rating = mongoose.model('Rating', quickRatingSchema);
