import express from 'express';
import * as recommendationController from '../controllers/recommendationController.js';

const router = express.Router();

router.get('/', recommendationController.getRecommendations);

export default router;
