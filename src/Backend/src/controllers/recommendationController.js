import * as recommendationService from '../services/recommendationService.js';

export const getRecommendations = async (req, res) => {
  if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const clerkId = req.auth.userId;
    const recommendations = await recommendationService.getAIRecommendations(clerkId);
    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation Controller Error:", error.message);
    res.status(500).json({ error: "Failed to generate AI recommendations" });
  }
};
