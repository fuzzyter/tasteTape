import { Review } from '../models/Review.js';

// Save a new review to the database
export const addReview = async (reviewData) => {
    const newReview = new Review(reviewData);
    return await newReview.save();
};

// Fetch all reviews for a specific movie (sorted by newest)
export const getReviewsByMovie = async (movieId) => {
    return await Review.find({ movieId: Number(movieId) })
        .sort({ timestamp: -1 });
};

// Fetch all reviews written by a specific user (for their profile page)
export const getReviewsByUser = async (clerkId) => {
    return await Review.find({ clerkId })
        .sort({ timestamp: -1 });
};

// Delete a review (if the user wants to remove their opinion later)
export const deleteReview = async (reviewId, clerkId) => {
    return await Review.findOneAndDelete({ _id: reviewId, clerkId });
};
