import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { protect, verifyWorkspaceAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(verifyWorkspaceAccess);

router.get('/', globalSearch);

export default router;
