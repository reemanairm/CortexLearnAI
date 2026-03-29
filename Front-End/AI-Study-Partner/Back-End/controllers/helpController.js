import HelpRequest from '../models/HelpRequest.js';

// @desc    Submit a new help request
// @route   POST /api/help
// @access  Private
export const submitHelpRequest = async (req, res, next) => {
    try {
        const { sessionType, issueType, customIssue } = req.body;

        if (!sessionType || !issueType) {
            return res.status(400).json({
                success: false,
                error: 'Please provide sessionType and issueType',
                statusCode: 400
            });
        }

        const helpRequest = await HelpRequest.create({
            userId: req.user._id,
            sessionType,
            issueType,
            customIssue: customIssue || ""
        });

        res.status(201).json({
            success: true,
            data: helpRequest,
            message: 'Help request submitted successfully. An admin will review it shortly.'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all help requests for current user
// @route   GET /api/help/my-requests
// @access  Private
export const getMyHelpRequests = async (req, res, next) => {
    try {
        const requests = await HelpRequest.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};
