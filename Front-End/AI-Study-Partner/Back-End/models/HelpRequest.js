import mongoose from "mongoose";

const helpRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sessionType: {
            type: String,
            required: true,
            enum: ["dashboard", "quiz", "flashcards", "summary", "chatbot", "other"],
        },
        issueType: {
            type: String,
            required: true,
        },
        customIssue: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "resolved", "dismissed"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

// Index for getting requests quickly and sorting by newest
helpRequestSchema.index({ createdAt: -1 });

const HelpRequest = mongoose.models.HelpRequest || mongoose.model("HelpRequest", helpRequestSchema);

export default HelpRequest;
