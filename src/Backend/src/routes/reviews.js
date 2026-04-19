import express from 'express';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', reviewController.createReview);
router.get('/my-reviews', reviewController.getUserReviews);
router.get('/:movieId', reviewController.getMovieReviews);

export default router;
