import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  movieId: { type: Number, required: true },
  clerkId: { type: String, required: true },
  userName: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: String,
  timestamp: { type: Date, default: Date.now }
});

export const Review = mongoose.model('Review', reviewSchema);
