import express from 'express';
import { getOverviewAnalytics } from '../controllers/analyticsController.js';
import { protect, verifyWorkspaceAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(verifyWorkspaceAccess);

router.get('/overview', getOverviewAnalytics);

export default router;
