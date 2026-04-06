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
    console.log('Generate flashcards request:', {
      documentId: req.body.documentId,
      numCards: req.body.numCards || req.body.count,
      chapterId: req.body.chapterId,
      userId: req.user._id
    });

    // accept either `numCards` from frontend or legacy `count`
    const { documentId, numCards, count } = req.body;
    let limit = parseInt(numCards ?? count ?? 10, 10);

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide documentId',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id
    });

    if (!document) {
      console.error('Document not found:', documentId);
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    console.log('Document status:', document.status, 'Extracted text length:', document.extractedText?.length || 0);

    if (document.status !== 'ready') {
      console.error('Document not ready:', document.status);
      return res.status(400).json({
        success: false,
        error: `Document is currently ${document.status}. Please wait for processing to complete.`,
        statusCode: 400
      });
    }

    if (!document.extractedText || document.extractedText.length === 0) {
      console.error('No extracted text in document');
      return res.status(400).json({
        success: false,
        error: 'Document has no extracted text. Please re-upload the document.',
        statusCode: 400
      });
    }

    // Don't use fileData for processed documents - extracted text works better
    // const fileData = await getFileDataForGemini(document);

    // Filter text if chapterId is provided
    let textToProcess = document.extractedText;
    const { chapterId, isAutomatic } = req.body;
    let targetChapter = null;
    let chapterChunks = [];

    if (chapterId && document.chapters && document.chapters.length > 0) {
      targetChapter = document.chapters.id(chapterId);
      if (targetChapter) {
        console.log('Found chapter:', targetChapter.title, 'Chunks:', targetChapter.startChunkIndex, 'to', targetChapter.endChunkIndex);
        chapterChunks = document.chunks.slice(targetChapter.startChunkIndex, targetChapter.endChunkIndex + 1);
        textToProcess = chapterChunks.map(c => c.content).join('\n\n');
        console.log('Chapter text length:', textToProcess.length);
        
        // Dynamically scale flashcard count if automatic mode is engaged
        if (isAutomatic) {
           limit = Math.max(10, chapterChunks.length * 4); // Increased to 4 per chunk for exhaustive coverage
           console.log(`Automatic mode: Dynamic flashcard limit set to ${limit} for full coverage.`);
        }
      }
    }

    // Generate flashcards using Gemini - use text only, no file data
    const cards = await geminiService.generateFlashcards(
      textToProcess,
      limit,
      null // Use text-only mode for processed documents
    );

    console.log('Generated flashcards:', cards?.length || 0);

    if (!cards || cards.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'AI returned no flashcards, please try again',
        statusCode: 500
      });
    }

    if (cards.length < limit && !isAutomatic) {
      // if we got fewer cards than requested in manual mode, notify the frontend so user can retry
      return res.status(500).json({
        success: false,
        error: `Only ${cards.length} flashcards were generated. Please try again or with a smaller limit.`,
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
    console.log('Generate quiz request:', {
      documentId: req.body.documentId,
      numQuestions: req.body.numQuestions,
      chapterId: req.body.chapterId,
      userId: req.user._id
    });

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
      userId: req.user._id
    });

    if (!document) {
      console.error('Document not found:', documentId);
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    console.log('Document status:', document.status, 'Extracted text length:', document.extractedText?.length || 0);

    if (document.status !== 'ready') {
      console.error('Document not ready:', document.status);
      return res.status(400).json({
        success: false,
        error: `Document is ${document.status}. Quiz generation requires a ready document.`,
        statusCode: 400
      });
    }

    if (!document.extractedText || document.extractedText.length === 0) {
      console.error('No extracted text in document');
      return res.status(400).json({
        success: false,
        error: 'Document has no extracted text. Please re-upload the document.',
        statusCode: 400
      });
    }

    // Don't use fileData for processed documents - extracted text works better
    // const fileData = await getFileDataForGemini(document);

    // Filter text if chapterId is provided
    let textToProcess = document.extractedText;
    const { chapterId, isAutomatic } = req.body;
    let targetChapter = null;
    let numQuestionsParsed = parseInt(numQuestions) || 5;

    if (chapterId && document.chapters && document.chapters.length > 0) {
      targetChapter = document.chapters.id(chapterId);
      if (targetChapter) {
        console.log('Found chapter:', targetChapter.title, 'Chunks:', targetChapter.startChunkIndex, 'to', targetChapter.endChunkIndex);
        const chapterChunks = document.chunks.slice(targetChapter.startChunkIndex, targetChapter.endChunkIndex + 1);
        textToProcess = chapterChunks.map(c => c.content).join('\n\n');
        console.log('Chapter text length:', textToProcess.length);
        
        if (isAutomatic) {
           numQuestionsParsed = Math.max(15, chapterChunks.length * 6); // Increased to 6 per chunk to ensure quiz > flashcards and full depth
           console.log(`Automatic mode: Dynamic quiz limit set to ${numQuestionsParsed} for full coverage.`);
        }
      }
    }

    // Generate quiz using Gemini - use text only, no file data
    const questions = await geminiService.generateQuiz(
      textToProcess,
      numQuestionsParsed,
      req.body.difficulty || 'medium',
      null // Use text-only mode for processed documents
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
    console.log('Generate summary request:', {
      documentId: req.body.documentId,
      userId: req.user._id
    });

    const document = await Document.findOne({
      _id: req.body.documentId,
      userId: req.user._id
    });

    if (!document) {
      console.error('Document not found:', req.body.documentId);
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    console.log('Document status:', document.status, 'Extracted text length:', document.extractedText?.length || 0);

    if (document.status !== 'ready') {
      console.error('Document not ready:', document.status);
      return res.status(400).json({
        success: false,
        error: 'Document is not ready for summary generation',
        statusCode: 400
      });
    }

    if (!document.extractedText || document.extractedText.length === 0) {
      console.error('No extracted text in document');
      return res.status(400).json({
        success: false,
        error: 'Document has no extracted text. Please re-upload the document.',
        statusCode: 400
      });
    }

    // Don't send file data - use extracted text only (works better for processed docs)
    const summary = await geminiService.generateSummary(document.extractedText, null);

    console.log('Summary generated, length:', summary?.length || 0);

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
    console.error('Summary generation error:', error);
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
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    if (document.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: 'Document is not ready for chat',
        statusCode: 400
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

    // Don't use fileData - use chunks context only
    // const fileData = await getFileDataForGemini(document);

    // Generate response using Gemini
    const answer = await geminiService.chatWithContext(
      question,
      relevantChunks,
      null // Use text-only mode
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
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    if (document.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: 'Document is not ready for concept explanation',
        statusCode: 400
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