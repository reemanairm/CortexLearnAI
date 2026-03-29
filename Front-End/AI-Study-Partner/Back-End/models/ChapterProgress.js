import mongoose from 'mongoose';

const chapterProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  chapterTitle: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'needs_revision'],
    default: 'not_started'
  },
  flashcardsReviewed: {
    type: Number,
    default: 0
  },
  quizScore: {
    type: Number,
    default: null
  },
  weakTopics: {
    type: [String],
    default: []
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

chapterProgressSchema.index({ userId: 1, documentId: 1, chapterId: 1 });

const ChapterProgress = mongoose.models.ChapterProgress || mongoose.model('ChapterProgress', chapterProgressSchema);

export default ChapterProgress;
