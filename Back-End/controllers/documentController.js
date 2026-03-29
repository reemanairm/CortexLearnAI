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
    console.log('Upload request received:', {
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file',
      body: req.body
    });

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

    console.log(`Document ${document._id} created, starting background processing`);

    // Process PDF in background (in production, use a queue like Bull)
    // We don't await this to avoid blocking the response
    processPDF(document._id, req.file.path).catch(err => {
      console.error('PDF processing error:', err);
      // Update document status to failed if processing fails
      Document.findByIdAndUpdate(document._id, {
        status: 'failed',
        errorReason: err.message || 'Processing failed'
      }).catch(() => {});
    });

    res.status(201).json({
      success: true,
      data: {
        _id: document._id,
        title: document.title,
        fileName: document.fileName,
        status: document.status,
        uploadDate: document.uploadDate
      },
      message: 'Document uploaded successfully. Processing in progress...'
    });

  } catch (error) {
    console.error('Upload error:', error);
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
    if (!text || text.trim().length === 0) {
      throw new Error('No text content extracted from document');
    }

    const chunks = chunkText(text, 500, 50);
    
    if (!chunks || chunks.length === 0) {
      throw new Error('Failed to chunk document text');
    }

    console.log(`Document ${documentId}: Created ${chunks.length} chunks from ${text.length} characters`);

    // Detect chapters from AI
    let mappedChapters = [];
    try {
      const rawChapters = await detectChapters(text);
      console.log(`Document ${documentId}: AI detected ${rawChapters?.length || 0} chapters`);

      if (rawChapters && rawChapters.length > 0) {
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
              // Try partial match (first 20 chars)
              const partial = cleanQuote.substring(0, 20);
              if (chunks[i].content.toLowerCase().includes(partial)) return i;
            }
            return -1;
          };

          const searchFrom = (index > 0 && mappedChapters[index - 1]) 
            ? mappedChapters[index - 1].endChunkIndex + 1 
            : 0;
          
          const foundStart = findBestChunk(cap.startQuote, searchFrom);
          if (foundStart !== -1) startIdx = foundStart;

          const foundEnd = findBestChunk(cap.endQuote, startIdx !== -1 ? startIdx : searchFrom);
          if (foundEnd !== -1) endIdx = foundEnd;

          // Fallbacks for consistency
          if (startIdx === -1) {
            startIdx = (index > 0 && mappedChapters[index - 1]) 
              ? mappedChapters[index - 1].endChunkIndex + 1 
              : 0;
          }

          if (endIdx === -1 || endIdx < startIdx) {
            // If it's the last chapter, go to the end
            if (index === rawChapters.length - 1) {
              endIdx = chunks.length - 1;
            } else {
              // Estimate end based on equal distribution
              const remainingChapters = rawChapters.length - index;
              const remainingChunks = chunks.length - startIdx;
              endIdx = Math.min(startIdx + Math.ceil(remainingChunks / remainingChapters) - 1, chunks.length - 1);
            }
          }

          mappedChapters.push({
            title: cap.title,
            summary: cap.summary || 'Key concepts and topics for this section.',
            startChunkIndex: startIdx,
            endChunkIndex: endIdx
          });
        }

        // Final pass to fix any overlaps and ensure no gaps
        for (let i = 0; i < mappedChapters.length; i++) {
          if (i > 0) {
            // Ensure no overlap with previous chapter
            const prevEnd = mappedChapters[i - 1].endChunkIndex;
            if (mappedChapters[i].startChunkIndex <= prevEnd) {
              mappedChapters[i].startChunkIndex = prevEnd + 1;
            }
          }
          // Ensure chapter has at least one chunk
          if (mappedChapters[i].endChunkIndex < mappedChapters[i].startChunkIndex) {
            mappedChapters[i].endChunkIndex = mappedChapters[i].startChunkIndex;
          }
        }
      }
    } catch (chapterError) {
      console.error(`Chapter detection error for ${documentId}:`, chapterError.message);
    }

    // Procedural Fallback if AI fails or returns too few chapters for a large doc
    if (!mappedChapters || mappedChapters.length === 0) {
      console.log(`Applying procedural fallback for document ${documentId}`);
      const numFallbacks = Math.max(3, Math.min(6, Math.ceil(chunks.length / 5)));
      const chunkSize = Math.ceil(chunks.length / numFallbacks);

      mappedChapters = [];
      for (let i = 0; i < numFallbacks; i++) {
        const start = i * chunkSize;
        const end = Math.min((i + 1) * chunkSize - 1, chunks.length - 1);
        if (start <= end && start < chunks.length) {
          mappedChapters.push({
            title: `Section ${i + 1}: Content Overview`,
            summary: `This section covers a portion of the document for structured learning.`,
            startChunkIndex: start,
            endChunkIndex: end
          });
        }
      }
    }

    // Ensure all chunks are covered by chapters
    const lastChapterEnd = mappedChapters[mappedChapters.length - 1]?.endChunkIndex || 0;
    if (lastChapterEnd < chunks.length - 1) {
      // Add a final section to cover remaining chunks
      mappedChapters.push({
        title: `Final Section: Additional Content`,
        summary: `Remaining content from the document.`,
        startChunkIndex: lastChapterEnd + 1,
        endChunkIndex: chunks.length - 1
      });
    }

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      chapters: mappedChapters,
      status: 'ready'
    });
    console.log(`Document ${documentId} processed successfully with ${mappedChapters.length} chapters`);
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
    console.log(`=== Starting PDF processing for document ${documentId} ===`);
    console.log(`File path received: ${filePath}`);
    console.log(`File path type: ${typeof filePath}`);
    
    // Validate file path
    if (!filePath) {
      throw new Error('No file path provided');
    }
    
    // Import path module for normalization
    const path = await import('path');
    
    // Normalize the path for the current OS
    const normalizedPath = path.normalize(filePath);
    console.log(`Normalized path: ${normalizedPath}`);
    
    // Check if file exists
    const fs = await import('fs/promises');
    try {
      await fs.access(normalizedPath);
      console.log(`✓ File exists and is accessible: ${normalizedPath}`);
    } catch (accessError) {
      console.error(`✗ File access error: ${normalizedPath}`);
      console.error(`Access error details:`, accessError.message);
      
      // List files in uploads directory for debugging
      const uploadDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'uploads', 'documents');
      try {
        const files = await fs.readdir(uploadDir);
        console.log(`Files in upload directory:`, files);
      } catch (dirError) {
        console.error(`Cannot read upload directory:`, dirError.message);
      }
      
      throw new Error(`Cannot access uploaded file: ${accessError.message}`);
    }
    
    const { text, numPages } = await extractTextFromPDF(normalizedPath);
    
    console.log(`✓ PDF extracted: ${text.length} characters, ${numPages} pages`);
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty text extracted from PDF');
    }
    
    // Update document with page count first
    await Document.findByIdAndUpdate(documentId, {
      pageCount: numPages
    });
    
    await processTextAndChapters(documentId, text);
    
    console.log(`=== PDF processing complete for document ${documentId} ===`);
  } catch (error) {
    console.error(`=== ERROR: PDF processing failed for ${documentId} ===`);
    console.error(`Error:`, error.message);
    console.error(`Stack:`, error.stack);
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
    const { videoUrl, pastedTranscript } = req.body;
    if (!videoUrl && !pastedTranscript) {
      return res.status(400).json({ success: false, error: 'Please provide a videoUrl or transcript', statusCode: 400 });
    }

    let transcriptStr = '';

    if (pastedTranscript) {
      console.log('Using manually pasted transcript');
      transcriptStr = pastedTranscript;
    } else {
      let transcriptArray;
      const languages = ['en', 'hi'];
      let success = false;
      let lastError = null;

      for (const lang of languages) {
        try {
          console.log(`Attempting to fetch transcript in language: ${lang}`);
          transcriptArray = await fetchTranscript(videoUrl, { lang });
          if (transcriptArray && transcriptArray.length > 0) {
            success = true;
            transcriptStr = transcriptArray.map(t => t.text).join(' ');
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`Failed to fetch ${lang} transcript:`, err.message);
        }
      }

      if (!success) {
        console.error('YouTube transcript error:', lastError);
        let errorMessage = 'Failed to fetch video transcript automatically.';
        let isBlocked = false;

        if (lastError?.message?.includes('too many requests') || lastError?.message?.includes('429')) {
          errorMessage = 'YouTube has blocked our server request due to high traffic.';
          isBlocked = true;
        } else if (lastError?.message?.includes('Could not find transcript')) {
          errorMessage = 'No English or Hindi transcript found for this video.';
        }

        return res.status(isBlocked ? 429 : 400).json({ 
          success: false, 
          error: errorMessage, 
          isBlocked,
          statusCode: isBlocked ? 429 : 400 
        });
      }
    }

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