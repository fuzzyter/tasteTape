import * as friendService from '../services/friendService.js';

export const requestFriend = async (req, res) => {
  if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const { recipientId } = req.body;
    const request = await friendService.sendFriendRequest(req.auth.userId, recipientId);
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptFriend = async (req, res) => {
  if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { requesterId } = req.body;
    const updated = await friendService.acceptFriendRequest(requesterId, req.auth.userId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActivity = async (req, res) => {
  if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const activity = await friendService.getFriendActivity(req.auth.userId);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
