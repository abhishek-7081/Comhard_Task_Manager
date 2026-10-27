import express from 'express';
import {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  reorderSections
} from '../controllers/sectionController.js';
import { protect, verifyWorkspaceAccess, requireWorkspaceWrite } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(verifyWorkspaceAccess);

router.get('/', getSections);
router.post('/', requireWorkspaceWrite, createSection);
router.post('/reorder', requireWorkspaceWrite, reorderSections);
router.get('/:id', getSectionById);
router.patch('/:id', requireWorkspaceWrite, updateSection);
router.delete('/:id', requireWorkspaceWrite, deleteSection);

export default router;
