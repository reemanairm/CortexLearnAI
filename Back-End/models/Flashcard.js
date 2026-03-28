import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
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
  title: {
    type: String,
    default: 'Untitled Flashcard Set'
  },
  cards: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    lastReviewed: {
      type: Date,
      default: null
    },
    isStarred: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
}); 

// Index for faster queries
flashcardSchema.index({ userId: 1, documentId: 1 });

// avoid overwriting model on reload
const Flashcard = mongoose.models.Flashcard || mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;