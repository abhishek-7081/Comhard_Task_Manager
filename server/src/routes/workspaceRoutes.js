import express from 'express';
import {
  getMyWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  addMember
} from '../controllers/workspaceController.js';
import { protect, verifyWorkspaceAccess, requireWorkspaceAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyWorkspaces);
router.post('/', createWorkspace);
router.get('/:id', getWorkspaceById);
router.patch('/:workspaceId', verifyWorkspaceAccess, requireWorkspaceAdmin, updateWorkspace);
router.post('/:workspaceId/members', verifyWorkspaceAccess, requireWorkspaceAdmin, addMember);

export default router;
