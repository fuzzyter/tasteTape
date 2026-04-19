import mongoose from 'mongoose';

const movieCacheSchema = new mongoose.Schema({
  movieId: { type: Number, required: true, unique: true },
  data: { type: Object, required: true }, // The full TMDB movie object
  expiresAt: { type: Date, required: true }
});

// Automatically delete documents when they expire
movieCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MovieCache = mongoose.model('MovieCache', movieCacheSchema);
