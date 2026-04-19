import express from 'express';
import * as friendController from '../controllers/friendController.js';

const router = express.Router();

// Auth is now checked inside the controller to avoid deprecation warnings
router.post('/request', friendController.requestFriend);
router.post('/accept', friendController.acceptFriend);
router.get('/activity', friendController.getActivity);

export default router;
