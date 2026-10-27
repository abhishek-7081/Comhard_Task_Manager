import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  transitionTaskStage,
  deleteTask,
  addComment
} from '../controllers/taskController.js';
import { protect, verifyWorkspaceAccess, requireWorkspaceWrite } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(verifyWorkspaceAccess);

router.get('/', getTasks);
router.post('/', requireWorkspaceWrite, createTask);
router.get('/:id', getTaskById);
router.patch('/:id', requireWorkspaceWrite, updateTask);
router.post('/:id/transitions', requireWorkspaceWrite, transitionTaskStage);
router.delete('/:id', requireWorkspaceWrite, deleteTask);
router.post('/:id/comments', requireWorkspaceWrite, addComment);

export default router;
