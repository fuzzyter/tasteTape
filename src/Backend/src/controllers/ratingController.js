import { Review } from '../models/Review.js';

// Get the average "TasteTape Score" for a specific movie
export const getAverageRating = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // Aggregate the average score using MongoDB
    const stats = await Review.aggregate([
      { $match: { movieId: Number(movieId) } },
      { 
        $group: { 
          _id: "$movieId", 
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        } 
      }
    ]);

    if (stats.length === 0) {
      return res.json({ averageRating: 0, totalReviews: 0 });
    }

    res.json({
      averageRating: stats[0].averageRating.toFixed(1),
      totalReviews: stats[0].totalReviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get the top 5 most-rated movies on the platform
export const getTrendingRatings = async (req, res) => {
  try {
    const trending = await Review.aggregate([
      { $group: { _id: "$movieId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
