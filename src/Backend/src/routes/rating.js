import express from 'express';
import * as ratingController from '../controllers/ratingController.js';

const router = express.Router();

router.get('/:movieId', ratingController.getAverageRating);
router.get('/trending/top', ratingController.getTrendingRatings);

export default router;
