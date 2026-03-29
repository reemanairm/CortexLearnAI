 import express from 'express';
import {
  getDashboard,
  getChapterProgress,
  updateChapterProgress
} from '../controllers/progressControllers.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/document/:documentId/chapters', getChapterProgress);
router.put('/document/:documentId/chapter/:chapterId', updateChapterProgress);

export default router;