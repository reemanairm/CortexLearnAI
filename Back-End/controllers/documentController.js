import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import { generateStructuredNotes, detectChapters } from '../utils/geminiService.js';
import { generatePDF } from '../utils/pdfGenerator.js';
import { fetchTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import mongoose from 'mongoose';

// @desc    Upload PDF document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a PDF file',
        statusCode: 400
      });
    }

    // accept provided title or fall back to filename (without extension)
    let { title } = req.body;
    if (!title) {
      title = req.file.originalname.replace(/\.pdf$/i, '');
    }

    // Construct the URL for the uploaded file
    // Construct the URL for the uploaded file
    const baseUrl = process.env.BASE_URL || "";
    const fileUrl = baseUrl ? `${baseUrl}/uploads/documents/${req.file.filename}` : `/uploads/documents/${req.file.filename}`;

    // Create document record
    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: req.file.originalname,
      filePath: fileUrl,
      fileSize: req.file.size,
      status: 'processing'
    });

    // Process PDF in background (in production, use a queue like Bull)
    processPDF(document._id, req.file.path).catch(err => {
      console.error('PDF processing error:', err);
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully. Processing in progress...'
    });

  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

// Helper function to process PDF text and extract chapters
const processTextAndChapters = async (documentId, text) => {
  try {
    const chunks = chunkText(text, 500, 50);
    const rawChapters = await detectChapters(text);

    let mappedChapters = rawChapters.map((cap, index) => {
        let startIdx = 0;
        let endIdx = chunks.length - 1;
        
        chunks.forEach(c => {
           if(cap.startQuote && c.content.includes(cap.startQuote)) startIdx = c.chunkIndex;
           if(cap.endQuote && c.content.includes(cap.endQuote)) endIdx = c.chunkIndex;
        });

        // Ensure chronological consistency
        if(index > 0 && startIdx < mappedChapters[index-1].endChunkIndex) {
            startIdx = mappedChapters[index-1].endChunkIndex;
        }
        if(endIdx < startIdx) endIdx = chunks.length - 1;

        return {
           title: cap.title,
           summary: cap.summary,
           startChunkIndex: startIdx || 0,
           endChunkIndex: endIdx || (chunks.length - 1)
        };
    });

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      chapters: mappedChapters,
      status: 'ready'
    });
    console.log(`Document ${documentId} processed successfully with chapters`);
  } catch (error) {
    console.error(`Error processing text/chapters for ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, { status: 'failed' });
  }
};

// Helper function to process PDF
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);
    await processTextAndChapters(documentId, text);
  } catch (error) {
    console.error(`Error extracting PDF for ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, { status: 'failed' });
  }
};

// @desc    Upload Video Link
// @route   POST /api/documents/video
// @access  Private
export const processVideoLink = async (req, res, next) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ success: false, error: 'Please provide a videoUrl', statusCode: 400 });
    }

    const transcriptArray = await fetchTranscript(videoUrl);
    const transcriptStr = transcriptArray.map(t => t.text).join(' ');

    const structuredNotes = await generateStructuredNotes(transcriptStr);

    const titleMatch = structuredNotes.match(/^#+\s*(.+)/m);
    let generatedTitle = titleMatch ? titleMatch[1].trim() : `Video Notes - ${new Date().toLocaleDateString()}`;

    const filename = `video_${crypto.randomBytes(6).toString('hex')}.pdf`;
    const outputPath = await generatePDF(generatedTitle, structuredNotes, filename);

    const baseUrl = process.env.BASE_URL || "";
    const fileUrl = baseUrl ? `${baseUrl}/uploads/documents/${filename}` : `/uploads/documents/${filename}`;

    const document = await Document.create({
      userId: req.user._id,
      title: generatedTitle,
      fileName: filename,
      filePath: fileUrl,
      fileSize: Buffer.byteLength(structuredNotes, 'utf8'),
      status: 'processing'
    });

    // Process document in background
    processTextAndChapters(document._id, structuredNotes).catch(console.error);

    res.status(201).json({
      success: true,
      data: document,
      message: 'Video submitted successfully. Processing in progress...'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $lookup: {
          from: 'flashcards',
          localField: '_id',
          foreignField: 'documentId',
          as: 'flashcardSets'
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'documentId',
          as: 'quizzes'
        }
      },
      {
        $addFields: {
          flashcardCount: { $size: '$flashcardSets' },
          quizCount: { $size: '$quizzes' }
        }
      },
      {
        $project: {
          extractedText: 0,
          chunks: 0,
          flashcardSets: 0,
          quizzes: 0
        }
      },
      { $sort: { uploadDate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single document with chunks
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    // Get counts of associated flashcards and quizzes
    const flashcardCount = await Flashcard.countDocuments({
      documentId: document._id,
      userId: req.user._id
    });

    const quizCount = await Quiz.countDocuments({
      documentId: document._id,
      userId: req.user._id
    });

    // Update last accessed
    document.lastAccessed = Date.now();
    await document.save();

    // Combine document data with counts
    const documentData = document.toObject();
    documentData.flashcardCount = flashcardCount;
    documentData.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: documentData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    // Delete file from filesystem
    await fs.unlink(document.filePath).catch(() => {});

    // Delete document
    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};