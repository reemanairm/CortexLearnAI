import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChapterProgress from '../models/ChapterProgress.js';

// @desc    Get user learning statistics
// @route   GET /api/progress/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get counts
    const totalDocuments = await Document.countDocuments({ userId });
    const totalFlashcardSets = await Flashcard.countDocuments({ userId });
    const totalQuizzes = await Quiz.countDocuments({ userId });
    const completedQuizzes = await Quiz.countDocuments({ userId, completedAt: { $ne: null } });

    // Get flashcard statistics
    const flashcardSets = await Flashcard.find({ userId });
    let totalFlashcards = 0;
    let reviewedFlashcards = 0;
    let starredFlashcards = 0;

    flashcardSets.forEach(set => {
      totalFlashcards += set.cards.length;
      reviewedFlashcards += set.cards.filter(c => c.reviewCount > 0).length;
      starredFlashcards += set.cards.filter(c => c.isStarred).length;
    });

    // Get quiz statistics
    const quizzes = await Quiz.find({ userId, completedAt: { $ne: null } });
    const averageScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
      : 0;

    // Recent activity
    const recentDocuments = await Document.find({ userId })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select('title fileName lastAccessed status');

    const recentQuizzes = await Quiz.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('documentId', 'title')
      .select('title score totalQuestions completedAt');

    // Study streak: count of consecutive days (including today) with any activity
    // we'll consider quizzes completed and documents accessed as activity markers
    const activityDatesSet = new Set();

    quizzes.forEach(q => {
      if (q.completedAt) {
        activityDatesSet.add(q.completedAt.toISOString().split('T')[0]);
      }
    });

    recentDocuments.forEach(doc => {
      if (doc.lastAccessed) {
        activityDatesSet.add(doc.lastAccessed.toISOString().split('T')[0]);
      }
    });

    const activityDays = Array.from(activityDatesSet).sort((a, b) => b.localeCompare(a)); // newest first
    let studyStreak = 0;
    if (activityDays.length > 0) {
      let cursor = new Date();
      cursor.setHours(0, 0, 0, 0);

      for (const day of activityDays) {
        const dayDate = new Date(day);
        // difference in full days between cursor and dayDate
        const diff = Math.round((cursor - dayDate) / (1000 * 60 * 60 * 24));
        if (diff === studyStreak) {
          studyStreak += 1;
        } else if (diff > studyStreak) {
          break; // gap detected
        }
      }
    }

    // --- NEW ANALYTICS ---
    // 1. Concept Clarity (based on recent quizzes)
    let conceptClarity = 0;
    if (quizzes.length > 0) {
      // Weight recent quizzes more, and consider difficulty if available
      const recentAttempts = quizzes.slice(0, 10); // Last 10 quizzes
      const scoreSum = recentAttempts.reduce((sum, q) => sum + q.score, 0);
      conceptClarity = Math.round(scoreSum / recentAttempts.length);
    }

    // 2. Document Coverage (Documents actively studied vs total documents)
    const studiedDocumentIds = new Set();
    // Add documents with flashcards
    flashcardSets.forEach(set => studiedDocumentIds.add(set.documentId.toString()));
    // Add documents with quizzes
    quizzes.forEach(quiz => studiedDocumentIds.add(quiz.documentId.toString()));
    
    const coveredDocuments = studiedDocumentIds.size;
    const documentCoveragePercentage = totalDocuments > 0 
      ? Math.round((coveredDocuments / totalDocuments) * 100) 
      : 0;

    // 3. Flashcard Mastery
    const masteredFlashcards = flashcardSets.reduce((count, set) => {
      // Consider a card mastered if it is explicitly marked as learnt
      return count + set.cards.filter(c => c.isLearnt).length;
    }, 0);
    
    const flashcardMasteryPercentage = totalFlashcards > 0 
      ? Math.round((masteredFlashcards / totalFlashcards) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          totalQuizzes,
          completedQuizzes,
          averageScore,
          studyStreak,
          // New advanced metrics
          conceptClarity,
          coveredDocuments,
          documentCoveragePercentage,
          masteredFlashcards,
          flashcardMasteryPercentage
        },
        recentActivity: {
          documents: recentDocuments,
          quizzes: recentQuizzes
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress for all chapters in a document
// @route   GET /api/progress/document/:documentId/chapters
// @access  Private
export const getChapterProgress = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) return res.status(404).json({ success: false, error: 'Document not found' });

    let progressRecords = await ChapterProgress.find({ userId: req.user._id, documentId });

    // Ensure records exist for all chapters
    const existingChapterIds = progressRecords.map(p => p.chapterId.toString());
    const newRecords = [];

    for (const chapter of document.chapters) {
      if (!existingChapterIds.includes(chapter._id.toString())) {
        newRecords.push({
          userId: req.user._id,
          documentId,
          chapterId: chapter._id,
          chapterTitle: chapter.title,
          status: 'not_started'
        });
      }
    }

    if (newRecords.length > 0) {
      await ChapterProgress.insertMany(newRecords);
      progressRecords = await ChapterProgress.find({ userId: req.user._id, documentId });
    }

    // Attach summary to the response
    const enrichedProgress = progressRecords.map(record => {
      const docChapter = document.chapters.id(record.chapterId);
      return {
        ...record.toObject(),
        summary: docChapter ? docChapter.summary : ''
      };
    });

    res.status(200).json({ success: true, data: enrichedProgress });
  } catch (error) { next(error); }
};

// @desc    Update progress for a specific chapter
// @route   PUT /api/progress/document/:documentId/chapter/:chapterId
// @access  Private
export const updateChapterProgress = async (req, res, next) => {
  try {
    const { documentId, chapterId } = req.params;
    const { status, flashcardsReviewed, quizScore, weakTopics } = req.body;

    let progress = await ChapterProgress.findOne({ userId: req.user._id, documentId, chapterId });
    if (!progress) {
       const doc = await Document.findOne({ _id: documentId, userId: req.user._id });
       if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
       const chap = doc.chapters.id(chapterId);
       if (!chap) return res.status(404).json({ success: false, error: 'Chapter not found' });

       progress = new ChapterProgress({
           userId: req.user._id, documentId, chapterId, chapterTitle: chap.title
       });
    }

    if (status !== undefined) progress.status = status;
    if (flashcardsReviewed !== undefined) progress.flashcardsReviewed = flashcardsReviewed;
    if (quizScore !== undefined) {
      progress.quizScore = quizScore;
      
      const Flashcard = (await import('../models/Flashcard.js')).default;
      const flashcardSet = await Flashcard.findOne({ documentId, chapterId, userId: req.user._id });
      const learntFlashcards = flashcardSet ? flashcardSet.cards.filter(c => c.isLearnt).length : 0;
      const totalFlashcards = flashcardSet ? flashcardSet.cards.length : 1; // avoid div by zero

      if (quizScore >= 70 && (learntFlashcards / totalFlashcards >= 0.9)) {
        progress.status = 'completed';
      } else if (quizScore < 70) {
        progress.status = 'needs_revision';
      } else {
        progress.status = 'in_progress';
      }
    }
    if (weakTopics !== undefined) progress.weakTopics = weakTopics;

    progress.lastActivity = Date.now();
    await progress.save();

    res.status(200).json({ success: true, data: progress });
  } catch (error) { next(error); }
};