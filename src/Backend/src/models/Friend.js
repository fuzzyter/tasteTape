import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  requester: { type: String, required: true }, // Clerk User ID
  recipient: { type: String, required: true }, // Clerk User ID
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate friend requests
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const Friend = mongoose.model('Friend', friendSchema);
