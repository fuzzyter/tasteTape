import * as reviewService from '../services/reviewService.js';
import * as activityService from '../services/activityService.js';

export const createReview = async (req, res) => {
  if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { movieId, movieTitle, rating, reviewText, userName } = req.body;
    
    const reviewData = {
      movieId,
      clerkId: req.auth.userId,
      userName,
      rating,
      reviewText
    };

    const newReview = await reviewService.addReview(reviewData);

    // Log activity
    await activityService.logActivity(req.auth.userId, 'REVIEWED', { 
      movieId, 
      movieTitle, 
      rating 
    });

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const reviews = await reviewService.getReviewsByMovie(movieId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const reviews = await reviewService.getReviewsByUser(req.auth.userId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
