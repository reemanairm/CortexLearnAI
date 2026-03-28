import Document from '../models/Document.js';
import ChatHistory from '../models/ChatHistory.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import * as geminiService from '../utils/geminiService.js';
import { findRelevantChunks } from '../utils/textChunker.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to construct Gemini inlineData from local file
const getFileDataForGemini = async (document) => {
  try {
    if (!document.filePath) return null;

    // Parse the local filename from the URL saved in DB
    const urlParts = document.filePath.split('/');
    const filename = urlParts[urlParts.length - 1];

    const localPath = path.join(__dirname, '..', 'uploads', 'documents', filename);
    const fileBuffer = await fs.readFile(localPath);

    return {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: "application/pdf"
      }
    };
  } catch (e) {
    console.error("Could not load file buffer for multimodal context", e);
    return null; // Fallback to text-only if file read fails
  }
};

// @desc      Generate flashcards from document
// @route     POST /api/ai/generate-flashcards
// @access    Private
export const generateFlashcards = async (req, res, next) => {
  try {
    // accept either `numCards` from frontend or legacy `count`
    const { documentId, numCards, count } = req.body;
    const limit = parseInt(numCards ?? count ?? 10, 10);

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide documentId',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not ready',
        statusCode: 404
      });
    }

    const fileData = await getFileDataForGemini(document);

    // Filter text if chapterId is provided
    let textToProcess = document.extractedText;
    const { chapterId } = req.body;
    let targetChapter = null;

    if (chapterId && document.chapters && document.chapters.length > 0) {
      targetChapter = document.chapters.id(chapterId); // mongoose array lookup
      if (targetChapter) {
        // combine chunks for this chapter
        const chapterChunks = document.chunks.slice(targetChapter.startChunkIndex, targetChapter.endChunkIndex + 1);
        textToProcess = chapterChunks.map(c => c.content).join('\n\n');
      }
    }

    // Generate flashcards using Gemini
    const cards = await geminiService.generateFlashcards(
      textToProcess,
      limit,
      targetChapter ? null : fileData // Do not send full file if scoped to chapter
    );

    if (!cards || cards.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'AI returned no flashcards, please try again',
        statusCode: 500
      });
    }

    if (cards.length < limit) {
      // if we got fewer cards than requested, notify the frontend so user can retry
      return res.status(500).json({
        success: false,
        error: `AI only produced ${cards.length} flashcards instead of the requested ${limit}. Please try again or reduce the count.`,
        statusCode: 500
      });
    }

    // Save to database
    const flashcardSet = await Flashcard.create({
      userId: req.user._id,
      documentId: document._id,
      chapterId: targetChapter ? targetChapter._id : undefined,
      cards: cards.map(card => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        reviewCount: 0,
        isStarred: false
      }))
    });

    res.status(201).json({
      success: true,
      data: flashcardSet,
      message: 'Flashcards generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc      Generate quiz from document
// @route     POST /api/ai/generate-quiz
// @access    Private
export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numQuestions = 5, title } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide documentId',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not ready',
        statusCode: 404
      });
    }

    const fileData = await getFileDataForGemini(document);

    // Filter text if chapterId is provided
    let textToProcess = document.extractedText;
    const { chapterId } = req.body;
    let targetChapter = null;

    if (chapterId && document.chapters && document.chapters.length > 0) {
      targetChapter = document.chapters.id(chapterId);
      if (targetChapter) {
        const chapterChunks = document.chunks.slice(targetChapter.startChunkIndex, targetChapter.endChunkIndex + 1);
        textToProcess = chapterChunks.map(c => c.content).join('\n\n');
      }
    }

    // Generate quiz using Gemini
    const questions = await geminiService.generateQuiz(
      textToProcess,
      parseInt(numQuestions),
      req.body.difficulty || 'medium',
      targetChapter ? null : fileData // Do not send full file if scoped to chapter
    );

    // ensure we actually received questions
    if (!questions || questions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'AI returned no quiz questions, please try again',
        statusCode: 500
      });
    }

    // Save to database
    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      chapterId: targetChapter ? targetChapter._id : undefined,
      title: title || (targetChapter ? `${document.title} - ${targetChapter.title} Quiz` : `${document.title} - Quiz`),
      questions: questions,
      totalQuestions: questions.length,
      userAnswers: [],
      score: 0
    });

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Generate Document Summary
===================================================== */
// @desc    Generate document summary
// @route   POST /api/ai/generate-summary
// @access  Private
export const generateSummary = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.body.documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not ready',
        statusCode: 404
      });
    }

    const fileData = await getFileDataForGemini(document);

    const summary = await geminiService.generateSummary(
      document.extractedText,
      fileData
    );

    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        summary
      },
      message: 'Summary generated successfully'
    });

  } catch (error) {
    next(error);
  }
};


/* =====================================================
   Chat With Document
===================================================== */
// @desc    Chat with document
// @route   POST /api/ai/chat
// @access  Private
export const chat = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({
        success: false,
        error: 'Please provide documentId and question',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not ready',
        statusCode: 404
      });
    }

    // Find relevant chunks
    const relevantChunks = findRelevantChunks(document.chunks, question, 3);
    const chunkIndices = relevantChunks.map(c => c.chunkIndex);

    // Get or create chat history
    let chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: document._id
    });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: req.user._id,
        documentId: document._id,
        messages: []
      });
    }

    const fileData = await getFileDataForGemini(document);

    // Generate response using Gemini
    const answer = await geminiService.chatWithContext(
      question,
      relevantChunks,
      fileData
    );

    // Save conversation
    chatHistory.messages.push(
      {
        role: 'user',
        content: question,
        timestamp: new Date(),
        relevantChunks: []
      },
      {
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        relevantChunks: chunkIndices
      }
    );

    await chatHistory.save();

    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        relevantChunks: chunkIndices,
        chatHistoryId: chatHistory._id
      },
      message: 'Response generated successfully'
    });

  } catch (error) {
    next(error);
  }
};


/* =====================================================
   Explain Concept
===================================================== */
// @desc    Explain concept from document
// @route   POST /api/ai/explain-concept
// @access  Private
export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;

    if (!documentId || !concept) {
      return res.status(400).json({
        success: false,
        error: 'Please provide documentId and concept',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not ready',
        statusCode: 404
      });
    }

    // Find relevant chunks
    const relevantChunks = findRelevantChunks(document.chunks, concept, 3);
    const context = relevantChunks.map(c => c.content).join('\n\n');

    // Generate explanation
    const explanation = await geminiService.explainConcept(
      concept,
      context
    );

    res.status(200).json({
      success: true,
      data: {
        concept,
        explanation,
        relevantChunks: relevantChunks.map(c => c.chunkIndex)
      },
      message: 'Explanation generated successfully'
    });

  } catch (error) {
    next(error);
  }
};


/* =====================================================
   Get Chat History
===================================================== */
// @desc    Get chat history for a document
// @route   GET /api/ai/chat-history/:documentId
// @access  Private
export const getChatHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide documentId',
        statusCode: 400
      });
    }

    const chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: documentId
    }).select('messages');//only retrieve the messages array

    if (!chatHistory) {
      return res.status(200).json({
        sucess: true,
        data: [], // Return an empty array if no chat history found
        message: 'No chat history found for this document'
      })
    }

    res.status(200).json({
      success: true,
      data: chatHistory.messages,
      message: 'Chat history retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Delete Chat History
===================================================== */
// @desc    Delete chat history for a document
// @route   DELETE /api/ai/chat-history/:documentId
// @access  Private
export const deleteChatHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide documentId',
        statusCode: 400
      });
    }

    const chatHistory = await ChatHistory.findOneAndDelete({
      userId: req.user._id,
      documentId: documentId
    });

    if (!chatHistory) {
      return res.status(404).json({
        success: false,
        error: 'No chat history found for this document',
        statusCode: 404
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat history deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Clear All Chat Histories
===================================================== */
// @desc    Clear all chat histories for the user
// @route   DELETE /api/ai/chat-history
// @access  Private
export const clearAllChatHistory = async (req, res, next) => {
  try {
    const result = await ChatHistory.deleteMany({
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `${result.deletedCount} chat histories cleared successfully`
    });

  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Delete Chat Message
===================================================== */
// @desc    Delete a specific message from chat history
// @route   DELETE /api/ai/chat-history/:documentId/message/:messageId
// @access  Private
export const deleteChatMessage = async (req, res, next) => {
  try {
    const { documentId, messageId } = req.params;

    if (!documentId || !messageId) {
      return res.status(400).json({ success: false, error: 'Please provide documentId and messageId', statusCode: 400 });
    }

    const chatHistory = await ChatHistory.findOne({ userId: req.user._id, documentId });
    if (!chatHistory) {
      return res.status(404).json({ success: false, error: 'Chat history not found', statusCode: 404 });
    }

    const messageIndex = chatHistory.messages.findIndex(m => m._id.toString() === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({ success: false, error: 'Message not found', statusCode: 404 });
    }

    // Delete the message (and the assistant reply if it's a user message)
    let deleteCount = 1;
    if (chatHistory.messages[messageIndex].role === 'user' && 
        messageIndex + 1 < chatHistory.messages.length && 
        chatHistory.messages[messageIndex + 1].role === 'assistant') {
      deleteCount = 2;
    }

    chatHistory.messages.splice(messageIndex, deleteCount);
    await chatHistory.save();

    res.status(200).json({ success: true, message: 'Message deleted successfully', data: chatHistory.messages });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Edit Chat Message
===================================================== */
// @desc    Edit a user message, trim subsequent messages, and regenerate response
// @route   PUT /api/ai/chat-history/:documentId/message/:messageId
// @access  Private
export const editChatMessage = async (req, res, next) => {
  try {
    const { documentId, messageId } = req.params;
    const { question } = req.body;

    if (!documentId || !messageId || !question) {
      return res.status(400).json({ success: false, error: 'Please provide documentId, messageId, and question', statusCode: 400 });
    }

    const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found or not ready', statusCode: 404 });
    }

    const chatHistory = await ChatHistory.findOne({ userId: req.user._id, documentId });
    if (!chatHistory) {
      return res.status(404).json({ success: false, error: 'Chat history not found', statusCode: 404 });
    }

    const messageIndex = chatHistory.messages.findIndex(m => m._id.toString() === messageId);
    if (messageIndex === -1 || chatHistory.messages[messageIndex].role !== 'user') {
      return res.status(404).json({ success: false, error: 'User message not found', statusCode: 404 });
    }

    // Trim history starting from the edited user message
    chatHistory.messages.splice(messageIndex);

    const relevantChunks = findRelevantChunks(document.chunks, question, 3);
    const chunkIndices = relevantChunks.map(c => c.chunkIndex);
    const fileData = await getFileDataForGemini(document);

    const answer = await geminiService.chatWithContext(question, relevantChunks, fileData);

    chatHistory.messages.push(
      { role: 'user', content: question, timestamp: new Date(), relevantChunks: [] },
      { role: 'assistant', content: answer, timestamp: new Date(), relevantChunks: chunkIndices }
    );

    await chatHistory.save();

    res.status(200).json({
      success: true,
      data: chatHistory.messages,
      message: 'Message edited and response regenerated successfully'
    });
  } catch (error) {
    next(error);
  }
};