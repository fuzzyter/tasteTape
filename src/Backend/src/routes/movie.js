import express from 'express';
import * as movieController from '../controllers/movieController.js';

const router = express.Router();

// Get the current trending movies
router.get('/trending', movieController.getTrending);

// Search for a movie by name
router.get('/search', movieController.search);

// Get details for a specific movie ID
router.get('/:id', movieController.getMovie);

// Get movies similar to one the user likes
router.get('/:id/similar', movieController.getSimilar);

export default router;
