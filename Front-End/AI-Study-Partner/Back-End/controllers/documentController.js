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

    let mappedChapters = [];
    for (let index = 0; index < rawChapters.length; index++) {
        const cap = rawChapters[index];
        let startIdx = (index === 0) ? 0 : -1;
        let endIdx = -1;
        
        // Helper to find best chunk for a quote
        const findBestChunk = (quote, searchFrom = 0) => {
            if (!quote || quote.trim().length < 4) return -1;
            const cleanQuote = quote.toLowerCase().trim();
            
            for (let i = searchFrom; i < chunks.length; i++) {
                if (chunks[i].content.toLowerCase().includes(cleanQuote)) return i;
                
                // Try partial match if exactly not found (first 15 chars)
                const partial = cleanQuote.substring(0, 15);
                if (chunks[i].content.toLowerCase().includes(partial)) return i;
            }
            return -1;
        };

        const searchFrom = (index > 0 && mappedChapters[index-1]) ? mappedChapters[index-1].endChunkIndex : 0;
        const foundStart = findBestChunk(cap.startQuote, searchFrom);
        if (foundStart !== -1) startIdx = foundStart;
        
        const foundEnd = findBestChunk(cap.endQuote, startIdx !== -1 ? startIdx : searchFrom);
        if (foundEnd !== -1) endIdx = foundEnd;

        // Fallbacks for consistency
        if (startIdx === -1) {
            startIdx = (index > 0) ? mappedChapters[index-1].endChunkIndex : 0;
        }
        
        if (endIdx === -1 || endIdx < startIdx) {
            // If it's the last chapter, go to the end
            if (index === rawChapters.length - 1) {
                endIdx = chunks.length - 1;
            } else {
                endIdx = Math.min(startIdx + 5, chunks.length - 1);
            }
        }

        mappedChapters.push({
           title: cap.title,
           summary: cap.summary,
           startChunkIndex: startIdx,
           endChunkIndex: endIdx
        });
    }

    // Final pass to fix any overlaps or gaps
    mappedChapters = mappedChapters.map((cap, i) => {
        if (i > 0 && cap.startChunkIndex < mappedChapters[i-1].endChunkIndex) {
            cap.startChunkIndex = mappedChapters[i-1].endChunkIndex;
        }
        if (cap.endChunkIndex < cap.startChunkIndex) {
            cap.endChunkIndex = cap.startChunkIndex;
        }
        return cap;
    });

    // Procedural Fallback if AI fails or returns too few chapters for a large doc
    if (!mappedChapters || mappedChapters.length === 0 || (chunks.length > 10 && mappedChapters.length < 2)) {
        console.log(`Applying procedural fallback for document ${documentId}`);
        const numFallbacks = Math.max(3, Math.min(6, Math.ceil(chunks.length / 5)));
        const chunkSize = Math.ceil(chunks.length / numFallbacks);
        
        mappedChapters = [];
        for (let i = 0; i < numFallbacks; i++) {
            const start = i * chunkSize;
            const end = Math.min((i + 1) * chunkSize - 1, chunks.length - 1);
            if (start < chunks.length) {
                mappedChapters.push({
                    title: `Section ${i + 1}: Content Overview`,
                    summary: `This section covers a portion of the document for structured learning.`,
                    startChunkIndex: start,
                    endChunkIndex: end
                });
            }
        }
    }

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      chapters: mappedChapters,
      status: 'ready'
    });
    console.log(`Document ${documentId} processed successfully with chapters`);
  } catch (error) {
    console.error(`Error processing text/chapters for ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, { 
      status: 'failed',
      errorReason: error.message || 'Chapter analysis failed'
    });
  }
};

// Helper function to process PDF
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);
    await processTextAndChapters(documentId, text);
  } catch (error) {
    console.error(`Error extracting PDF for ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, { 
      status: 'failed',
      errorReason: error.message || 'PDF extraction failed'
    });
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

    let transcriptArray;
    try {
      transcriptArray = await fetchTranscript(videoUrl);
    } catch (transcriptError) {
      console.error('YouTube transcript error:', transcriptError);
      let errorMessage = 'Failed to fetch video transcript.';
      if (transcriptError.message?.includes('too many requests') || transcriptError.message?.includes('captcha')) {
        errorMessage = 'YouTube has blocked our request due to high traffic. Please try again later or provide a PDF/Text version of the notes.';
      }
      return res.status(429).json({ 
        success: false, 
        error: errorMessage, 
        statusCode: 429 
      });
    }

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