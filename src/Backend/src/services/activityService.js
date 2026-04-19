import { Activity } from '../models/Activity.js';

export const logActivity = async (userId, type, metadata) => {
  try {
    return await Activity.create({ userId, type, metadata });
  } catch (error) {
    console.error("Failed to log activity:", error.message);
  }
};

export const getFeed = async (userIds) => {
  return await Activity.find({ userId: { $in: userIds } })
    .sort({ timestamp: -1 })
    .limit(20);
};
