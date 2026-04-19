import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk User ID
  type: { 
    type: String, 
    required: true,
    enum: ['WATCHED', 'REVIEWED', 'FRIEND_ADDED', 'VIBE_CHANGED']
  },
  // Flexible metadata field to store specific details (e.g. movieId, rating)
  metadata: {
    movieId: Number,
    movieTitle: String,
    rating: Number,
    vibe: String,
    friendId: String
  },
  timestamp: { type: Date, default: Date.now }
});

// Index for fast feed generation
activitySchema.index({ userId: 1, timestamp: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
