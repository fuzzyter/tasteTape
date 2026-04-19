import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.get('/sync', authController.syncUser);
router.get('/profile', authController.getProfile);

export default router;
