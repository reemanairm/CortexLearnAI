import Quiz from '../models/Quiz.js';

// @desc    Get all quizzes for the current user
// @route   GET /api/quizzes
// @access  Private
export const getAllQuizzes = async (req, res, next) => {
    try {
        const quizzes = await Quiz.find({ userId: req.user._id })
            .populate('documentId', 'title fileName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: quizzes.length,
            data: quizzes
        });
    } catch (error) {
        next(error);
    }
};
// @route   GET /api/quizzes/:documentId
// @access  Private
export const getQuizzes = async (req, res, next) => {
    try {
        const quizzes = await Quiz.find({
            userId: req.user._id,
            documentId: req.params.documentId
        })
        .populate('documentId', 'title fileName')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: quizzes.length,
            data: quizzes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single quiz by ID
// @route   GET /api/quizzes/quiz/:id
// @access  Private
export const getQuizById = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: quiz
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private
export const submitQuiz = async (req, res, next) => {
    try {
        const { answers } = req.body;

        if (!answers) {
            console.error('Missing answers in request body:', req.body);
            return res.status(400).json({
                success: false,
                error: 'Please provide answers array',
                statusCode: 400
            });
        }

        if (!Array.isArray(answers)) {
            console.error('Answers is not an array:', typeof answers, answers);
            return res.status(400).json({
                success: false,
                error: 'Please provide answers array',
                statusCode: 400
            });
        }

        const quiz = await Quiz.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            });
        }

        // Allow quiz retakes - users can resubmit a quiz
        // Previous submission (if any) will be overwritten
        if (quiz.completedAt) {
            console.log(`Quiz ${req.params.id} is being retaken by user ${req.user._id}`);
        }

        // Validate that all answers are provided
        if (answers.length !== quiz.questions.length) {
            console.error(`Answer count mismatch. Expected: ${quiz.questions.length}, Got: ${answers.length}`);
            return res.status(400).json({
                success: false,
                error: `Please answer all questions. Expected ${quiz.questions.length} answers but got ${answers.length}`,
                statusCode: 400
            });
        }

        // Process answers
        let correctCount = 0;
        const userAnswers = [];

        answers.forEach((answer, idx) => {
            const { questionIndex, selectedAnswer } = answer;

            if (questionIndex === undefined || selectedAnswer === undefined) {
                console.error(`Invalid answer format at index ${idx}:`, answer);
                throw new Error(`Invalid answer format: missing questionIndex or selectedAnswer`);
            }

            if (questionIndex >= quiz.questions.length || questionIndex < 0) {
                console.error(`Question index out of bounds: ${questionIndex}, max: ${quiz.questions.length}`);
                throw new Error(`Question index ${questionIndex} is out of bounds`);
            }

            const question = quiz.questions[questionIndex];
            
            if (!question.correctAnswer) {
                console.error(`Question ${questionIndex} missing correctAnswer:`, question);
                throw new Error(`Question ${questionIndex} is missing the correct answer`);
            }

            const isCorrect = selectedAnswer === question.correctAnswer;

            if (isCorrect) correctCount++;

            userAnswers.push({
                questionIndex,
                selectedAnswer,
                isCorrect,
                answeredAt: new Date()
            });
        });

        // Calculate score
        const score = Math.round((correctCount / quiz.totalQuestions) * 100);

        // Update quiz
        quiz.userAnswers = userAnswers;
        quiz.score = score;
        quiz.completedAt = new Date();

        await quiz.save();

        res.status(200).json({
            success: true,
            data: {
                quizId: quiz._id,
                score,
                correctCount,
                totalQuestions: quiz.totalQuestions,
                percentage: score,
                userAnswers
            },
            message: 'Quiz submitted successfully'
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Get quiz results
// @route   GET /api/quizzes/:id/results
// @access  Private
export const getQuizResults = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('documentId', 'title');

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            });
        }

        if (!quiz.completedAt) {
            return res.status(400).json({
                success: false,
                error: 'Quiz not completed yet',
                statusCode: 400
            });
        }

        // Build detailed results
        const detailedResults = quiz.questions.map((question, index) => {
            const userAnswer = quiz.userAnswers.find(a => a.questionIndex === index);

            return {
                questionIndex: index,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                selectedAnswer: userAnswer?.selectedAnswer || null,
                isCorrect: userAnswer?.isCorrect || false,
                explanation: question.explanation
            };
        });

        res.status(200).json({
            success: true,
            data: {
                quiz: {
                    id: quiz._id,
                    title: quiz.title,
                    document: quiz.documentId,
                    score: quiz.score,
                    totalQuestions: quiz.totalQuestions,
                    completedAt: quiz.completedAt
                },
                results: detailedResults
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
export const deleteQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            });
        }

        await quiz.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Quiz deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};