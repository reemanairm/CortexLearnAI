import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, PlayCircle, Clock, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import quizService from '../../services/quizservice';
import Loader from '../../components/common/Loader';

const QuizzesListPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const res = await quizService.getAllQuizzes();
            setQuizzes(res.data || []);
        } catch (error) {
            console.error('Failed to load quizzes', error);
            toast.error('Failed to load quizzes');
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (e, quizId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this quiz?')) {
            try {
                await quizService.deleteQuiz(quizId);
                setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
                toast.success('Quiz deleted successfully');
            } catch (error) {
                console.error("Failed to delete quiz", error);
                toast.error("Failed to delete quiz");
            }
        }
    };

    if (loading) {
        return <Loader message="Loading your quizzes..." />;
    }

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-20"></div>
                <BrainCircuit size={40} className="text-indigo-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">No Quizzes Yet</h2>
            <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                Quizzes are automatically generated when you upload study materials.
                Head over to the Documents section to upload a PDF and start testing your knowledge!
            </p>
            <button
                onClick={() => navigate('/documents')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-1"
            >
                Go to Documents
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <BrainCircuit className="text-indigo-400" size={24} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Your Quizzes</h1>
                    </div>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        Test your knowledge and track your mastery across all your study materials.
                    </p>
                </div>
            </div>

            {quizzes.length === 0 ? (
                renderEmptyState()
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div
                            key={quiz._id}
                            onClick={() => {
                                // If quiz is completed, go to results page; otherwise go to take quiz page
                                const targetPath = quiz.completedAt 
                                    ? `/quizzes/${quiz._id}/results` 
                                    : `/quizzes/${quiz._id}`;
                                navigate(targetPath);
                            }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-lg hover:shadow-indigo-500/10"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                    <BrainCircuit className="text-indigo-400" size={24} />
                                </div>
                                <div className="flex items-center gap-2">
                                    {quiz.score !== undefined && (
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                                            Score: {quiz.score}%
                                        </span>
                                    )}
                                    <button
                                        onClick={(e) => handleDeleteQuiz(e, quiz._id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Delete Quiz"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2 pr-2">
                                {quiz.title || 'Knowledge Check'}
                            </h3>

                            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-700/50 text-sm text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <PlayCircle size={16} />
                                    <span>{quiz.questions?.length || 0} Qs</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={16} />
                                    <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizzesListPage;
