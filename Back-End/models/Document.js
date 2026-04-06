import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  title: {
    type: String,
    required: [true, "Please provide a document title"],
    trim: true,
  },

  fileName: {
    type: String,
    required: true,
  },

  filePath: {
    type: String,
    required: true,
  },

  fileSize: {
    type: Number,
    required: true,
  },

  extractedText: {
    type: String,
    default: "",
  },

  chunks: [
    {
      content: {
        type: String,
        required: true,
      },
      pageNumber: {
        type: Number,
        default: 0,
      },
      chunkIndex: {
        type: Number,
        required: true,
      },
    },
  ],

  chapters: [
    {
      title: {
        type: String,
        required: true,
      },
      startChunkIndex: {
        type: Number,
        default: 0,
      },
      endChunkIndex: {
        type: Number,
        default: 0,
      },
      summary: {
        type: String,
        default: "",
      }
    }
  ],

  uploadDate: {
    type: Date,
    default: Date.now,
  },

  lastAccessed: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ["processing", "ready", "failed"],
    default: "processing",
  },
  errorReason: {
    type: String,
  },
  pageCount: {
    type: Number,
    default: 0,
  },
},
{
  timestamps: true,
}
);

// Index for faster queries
documentSchema.index({ userId: 1, uploadDate: -1 });

// avoid recompiling
const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);

export default Document;