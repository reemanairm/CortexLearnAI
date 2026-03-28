import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, BookOpen, Trophy, Target, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import quizService from '../../services/quizservice';
import aiService from '../../services/aiservice';
import AIChatModal from '../../components/common/AIChatModal';

// Helper component for the circular progress ring
const CircularProgress = ({ value, max, size = 160, strokeWidth = 12, isSuccess }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = max > 0 ? value / max : 0;
  const offset = circumference - percent * circumference;

  return (
    <div className="relative inline-flex items-center justify-center animate-in zoom-in duration-700 delay-150" style={{ width: size, height: size }}>
      {/* Background track */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-800"
        />
        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1500 ease-out ${isSuccess ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]'}`}
        />
      </svg>
      {/* Percentage Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter">
          {Math.round((value / max) * 100)}<span className="text-2xl sm:text-3xl text-slate-400">%</span>
        </span>
      </div>
    </div>
  );
};

const QuizResultPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'correct', 'incorrect'

  // Ask AI states for modal
  const [showAiChat, setShowAiChat] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');

  useEffect(() => {
    fetchResult();
  }, [quizId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await quizService.getQuizResults(quizId);
      setQuiz(res.data);
    } catch (error) {
      console.error('Error fetching results', error);
      toast.error('Could not load results');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Calculating your score..." />;
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No results available</h2>
        <p className="text-slate-400 max-w-sm mb-8">We couldn't find the results for this quiz.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  // backend returns { quiz: {...}, results: [...] }
  const quizInfo = quiz.quiz || quiz;
  const score = quizInfo.score || 0;
  const totalQuestions = quizInfo.totalQuestions || quizInfo.questions?.length || 0;
  // derive correct count from detailed results if available (more accurate than rounding)
  const correctCount = quiz.results
    ? quiz.results.filter(r => r.isCorrect).length
    : Math.round((score / 100) * totalQuestions);
  const passed = score >= 70;

  const handleAskAi = async (idx, questionText, correctAnswer, userAnswer) => {
    setCurrentQuestion(questionText);
    setShowAiChat(true);
    setCurrentExplanation('');
    setIsExplaining(true);

    try {
      const documentId = quizInfo.document || quizInfo.documentId;
      const concept = `Explain this quiz question in detail. Question: "${questionText}". The correct answer is "${correctAnswer}". The user answered "${userAnswer}". Provide a clear, educational explanation.`;
      const res = await aiService.explainConcept(documentId, concept);
      setCurrentExplanation(res.data.explanation);
    } catch (error) {
      console.error('Ask AI error', error);
      toast.error('Failed to get AI explanation');
      setShowAiChat(false);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 pt-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/documents')}
          className="w-12 h-12 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all border border-slate-700/50 backdrop-blur-sm shadow-sm"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Quiz Results</h1>
          <p className="text-slate-400 font-medium">Review your performance</p>
        </div>
      </div>

      {/* Hero Score Card */}
      <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-12 border shadow-2xl transition-colors duration-700 ${passed
        ? 'bg-slate-900/60 border-emerald-500/20 shadow-emerald-900/10'
        : 'bg-slate-900/60 border-indigo-500/20 shadow-indigo-900/10'
        }`}>
        {/* Background glow effects */}
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-50 ${passed ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-50 ${passed ? 'bg-teal-500/10' : 'bg-violet-500/10'}`}></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">

          <div className="text-center md:text-left flex-1 space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 mb-2">
              {passed ? (
                <Trophy className="text-yellow-400" size={32} />
              ) : (
                <Target className="text-indigo-400" size={32} />
              )}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {passed ? 'Outstanding Work!' : 'Room for Growth'}
            </h2>
            <p className="text-slate-300 text-lg max-w-md mx-auto md:mx-0 leading-relaxed">
              {passed
                ? "You've demonstrated a strong grasp of the material. Keep up the excellent work!"
                : "Every mistake is a learning opportunity. Review the answers below to improve."}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                <CheckCircle2 size={18} />
                <span className="font-bold">{correctCount} Correct</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-300">
                <AlertCircle size={18} />
                <span className="font-bold">{totalQuestions - correctCount} Incorrect</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <CircularProgress value={correctCount} max={totalQuestions} isSuccess={passed} />
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate('/documents')}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-bold border border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
        >
          <BookOpen className="text-slate-400 group-hover:text-slate-300 transition-colors" size={20} />
          Return to Library
        </button>
        <button
          onClick={() => navigate(`/quizzes/${quiz.documentId || quizId}`)}
          className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 text-white rounded-2xl transition-all font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 group ${passed
            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
            : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25'
            }`}
        >
          <RotateCcw className="transition-transform group-hover:-rotate-90" size={20} />
          {passed ? 'Practice Again' : 'Try Again'}
        </button>
      </div>

      {/* Weak Topics / Areas for Improvement */}
      {quizInfo.weakTopics && quizInfo.weakTopics.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Sparkles className="text-orange-400" size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">Focus Areas for Revision</h3>
          </div>
          <p className="text-slate-400 text-sm mb-6">We've identified these specific concepts that you might want to review based on your incorrect answers:</p>
          <div className="flex flex-wrap gap-3">
            {quizInfo.weakTopics.map((topic, i) => (
              <div key={i} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                {topic}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Review Section */}
      {quiz.results && quiz.results.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">
                📝
              </span>
              Detailed Review
            </h3>
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all'
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                All ({quiz.results.length})
              </button>
              <button
                onClick={() => setFilter('correct')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${filter === 'correct'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                <CheckCircle2 size={16} />
                Correct ({correctCount})
              </button>
              <button
                onClick={() => setFilter('incorrect')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${filter === 'incorrect'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                <XCircle size={16} />
                Incorrect ({totalQuestions - correctCount})
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {quiz.results.map((result, idx) => {
              const isCorrect = result.isCorrect;

              // Apply filter
              if (filter === 'correct' && !isCorrect) return null;
              if (filter === 'incorrect' && isCorrect) return null;

              const userAnswerText = result.selectedAnswer || 'Not answered';

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all p-6 sm:p-8 ${isCorrect
                    ? 'bg-slate-900 border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)]'
                    : 'bg-slate-900 border-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.05)]'
                    }`}
                >
                  {/* Status indicator bar left edge */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
                      }`}>
                      {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>

                    <div className="flex-1 space-y-6">

                      {/* Question */}
                      <div>
                        <div className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-2">
                          Question {idx + 1}
                        </div>
                        <p className="text-lg sm:text-xl font-medium text-white leading-relaxed">
                          {result.question}
                        </p>
                      </div>

                      {/* Answers Comparison */}
                      <div className="grid sm:grid-cols-2 gap-4">

                        {/* User's Answer */}
                        <div className={`rounded-xl p-4 border ${isCorrect
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                          }`}>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            Your Answer
                          </div>
                          <p className={`font-medium ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                            {userAnswerText}
                          </p>
                        </div>

                        {/* Correct Answer (only show if user was wrong) */}
                        {!isCorrect && (
                          <div className="rounded-xl p-4 bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                              <CheckCircle2 size={40} className="text-emerald-500" />
                            </div>
                            <div className="text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-2 flex items-center gap-2 relative z-10">
                              Correct Answer
                            </div>
                            <p className="font-medium text-emerald-400 relative z-10">
                              {result.correctAnswer}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* AI Explanation / Context */}
                      {result.explanation && (
                        <div className="mt-4 rounded-xl bg-slate-800/50 p-5 border border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Explanation</span>
                          </div>
                          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                            {result.explanation}
                          </p>
                        </div>
                      )}

                      {/* Ask AI Section */}
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <button
                          onClick={() => handleAskAi(idx, result.question, result.correctAnswer, userAnswerText)}
                          disabled={isExplaining}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-bold transition-colors border border-indigo-500/20 disabled:opacity-50"
                        >
                          <Sparkles size={16} />
                          {isExplaining ? 'AI Tutor is thinking...' : 'Ask AI for Deeper Explanation'}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AIChatModal
        isOpen={showAiChat}
        onClose={() => setShowAiChat(false)}
        title={currentQuestion || 'Quiz Question'}
        explanation={currentExplanation}
        documentId={quizInfo.document || quizInfo.documentId}
        isLoading={isExplaining}
      />

    </div>
  );
};

export default QuizResultPage;
