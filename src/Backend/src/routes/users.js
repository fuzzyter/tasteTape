import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/history', userController.updateHistory);
router.post('/preferences', userController.updatePreferences);

export default router;
