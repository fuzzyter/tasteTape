import { Friend } from '../models/Friend.js';
import { Review } from '../models/Review.js';

export const sendFriendRequest = async (requester, recipient) => {
  return await Friend.create({ requester, recipient });
};

export const acceptFriendRequest = async (requester, recipient) => {
  return await Friend.findOneAndUpdate(
    { requester, recipient, status: 'pending' },
    { status: 'accepted' },
    { new: true }
  );
};

export const getAcceptedFriends = async (userId) => {
  const friends = await Friend.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  });
  
  return friends.map(f => (f.requester === userId ? f.recipient : f.requester));
};

export const getFriendActivity = async (userId) => {
  const friendIds = await getAcceptedFriends(userId);
  
  // Fetch latest reviews from these friends
  return await Review.find({ clerkId: { $in: friendIds } })
    .sort({ timestamp: -1 })
    .limit(10);
};
