import User from '../models/User.js';
import Document from '../models/Document.js';
import Quiz from '../models/Quiz.js';
import HelpRequest from '../models/HelpRequest.js';
import fs from 'fs/promises';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all documents
// @route   GET /api/admin/documents
// @access  Private/Admin
export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.find({})
            .populate('userId', 'username email')
            .sort({ uploadDate: -1 });
        res.status(200).json({ success: true, count: documents.length, data: documents });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all help requests
// @route   GET /api/admin/help-requests
// @access  Private/Admin
export const getHelpRequests = async (req, res, next) => {
    try {
        const requests = await HelpRequest.find({})
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        next(error);
    }
};

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDocs = await Document.countDocuments();
        const totalQuizzes = await Quiz.countDocuments();
        const pendingTickets = await HelpRequest.countDocuments({ status: 'pending' });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalDocuments: totalDocs,
                totalQuizzes,
                pendingTickets
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/user/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Optional: Delete their documents from the file system
        const userDocs = await Document.find({ userId: user._id });
        for (const doc of userDocs) {
            if (doc.filePath) {
                // Need to parse out local filename from URL if stored that way
                try {
                    const urlParts = doc.filePath.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    await fs.unlink(`./uploads/documents/${filename}`).catch(() => { });
                } catch (e) { }
            }
        }

        // Mongoose cascading can be handled here or inside pre('remove')
        await Document.deleteMany({ userId: user._id });
        await Quiz.deleteMany({ userId: user._id });
        await HelpRequest.deleteMany({ userId: user._id });

        await user.deleteOne();

        res.status(200).json({ success: true, message: 'User and associated data deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete document
// @route   DELETE /api/admin/document/:id
// @access  Private/Admin
export const deleteSystemDocument = async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Attempt local file deletion
        try {
            const urlParts = document.filePath.split('/');
            const filename = urlParts[urlParts.length - 1];
            await fs.unlink(`./uploads/documents/${filename}`).catch(() => { });
        } catch (e) { }

        await document.deleteOne();
        // Related flashcards/quizzes should ideally cascade or be deleted too

        res.status(200).json({ success: true, message: 'Document deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Resolve help request
// @route   PUT /api/admin/help-requests/:id/resolve
// @access  Private/Admin
export const resolveHelpRequest = async (req, res, next) => {
    try {
        const request = await HelpRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, error: 'Help request not found' });
        }

        request.status = 'resolved';
        await request.save();

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        next(error);
    }
};
