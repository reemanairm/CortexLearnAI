import express from 'express';
import {
    getAllQuizzes,
    getQuizzes,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
} from '../controllers/quizController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all user quizzes (must be before :documentId route)
router.get('/', getAllQuizzes);
router.get('/quiz/:id', getQuizById);
router.post('/:id/submit', submitQuiz);
router.get('/:id/results', getQuizResults);
router.delete('/:id', deleteQuiz);
router.get('/:documentId', getQuizzes);

export default router;