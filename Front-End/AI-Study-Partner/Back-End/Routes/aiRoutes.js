import express from 'express';
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  getChatHistory,
  deleteChatHistory,
  clearAllChatHistory,
  deleteChatMessage,
  editChatMessage
} from '../controllers/aiController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate-flashcards', generateFlashcards);
router.post('/generate-quiz', generateQuiz);
router.post('/generate-summary', generateSummary);
router.post('/chat', chat);
router.post('/explain-concept', explainConcept);
router.get('/chat-history/:documentId', getChatHistory);
router.delete('/chat-history/:documentId', deleteChatHistory);
router.delete('/chat-history', clearAllChatHistory);
router.delete('/chat-history/:documentId/message/:messageId', deleteChatMessage);
router.put('/chat-history/:documentId/message/:messageId', editChatMessage);

export default router;