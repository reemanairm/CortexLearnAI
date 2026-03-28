import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronLeft, Target, Trophy, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import quizService from '../../services/quizservice';
import aiService from '../../services/aiservice';
import HelpWidget from '../../components/common/HelpWidget';
import AIChatModal from '../../components/common/AIChatModal';

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('slide-in-from-right'); // For question transitions
  const [showAiChat, setShowAiChat] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await quizService.getQuizById(quizId);
      setQuiz(res.data);
      
      // Debug log to check quiz structure
      console.log('Loaded quiz:', {
        id: res.data._id,
        title: res.data.title,
        questionsCount: res.data.questions?.length,
        sampleQuestions: res.data.questions?.slice(0, 2).map(q => ({
          question: q.question,
          optionsCount: q.options?.length,
          hasCorrectAnswer: !!q.correctAnswer,
          correctAnswer: q.correctAnswer
        }))
      });
      
      setCurrentQuestion(0);
    } catch (error) {
      console.error('Failed to load quiz', error);
      toast.error('Could not load quiz');
      navigate('/flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (option) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: option,
    }));
    // Auto advance after short delay if it's not the last question
    if (currentQuestion < quiz.questions.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 600);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setAnimationDirection('slide-in-from-right-8 fade-in');
      // Hack to trigger animation restart
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 10);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setAnimationDirection('slide-in-from-left-8 fade-in');
      setTimeout(() => setCurrentQuestion(currentQuestion - 1), 10);
    }
  };

  const handleAskAi = async () => {
    if (!quiz || !quiz.questions[currentQuestion]) return;

    const question = quiz.questions[currentQuestion];
    setShowAiChat(true);
    setCurrentExplanation('');

    // If we already have an explanation, don't fetch again
    if (currentExplanation) return;

    setIsExplaining(true);
    try {
      const concept = `Explain this quiz question and its context in detail. Question: "${question.question}". Options: ${question.options.join(', ')}. Provide a clear, educational explanation to help understand this concept.`;
      const res = await aiService.explainConcept(quiz.documentId, concept);
      setCurrentExplanation(res.data.explanation);
    } catch (error) {
      console.error('Ask AI error', error);
      toast.error('Failed to get AI explanation');
      setShowAiChat(false);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSubmit = async () => {
    // Validate quiz data
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      toast.error('Quiz data is invalid');
      console.error('Invalid quiz data:', quiz);
      return;
    }

    // Verify all questions are answered
    if (Object.keys(answers).length !== quiz.questions.length) {
      const answeredCount = Object.keys(answers).length;
      const totalCount = quiz.questions.length;
      toast.error(`Please answer all questions. Answered: ${answeredCount}/${totalCount}`, { icon: '🎯' });
      return;
    }

    setSubmitting(true);
    try {
      // Build payload with answers in proper order
      const payload = [];
      for (let i = 0; i < quiz.questions.length; i++) {
        if (answers[i] === undefined) {
          throw new Error(`Question ${i} is not answered`);
        }
        payload.push({
          questionIndex: i,
          selectedAnswer: answers[i],
        });
      }

      console.log('Submitting quiz with payload:', {
        quizId,
        answersCount: payload.length,
        questionsCount: quiz.questions.length,
        payload
      });

      await quizService.submitQuiz(quizId, payload);
      toast.success('Quiz submitted successfully! 🎉');
      navigate(`/quizzes/${quizId}/results`);
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error.message || error.error || 'Submission failed';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Preparing your quiz..." />;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Target size={64} className="text-slate-700 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Quiz not found</h2>
        <p className="text-slate-400 max-w-sm mb-8">This quiz might have been deleted or has no questions.</p>
        <button
          onClick={() => navigate('/documents')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Library
        </button>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / quiz.questions.length) * 100;
  const isComplete = answeredCount === quiz.questions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 pt-6">

      {/* Header & Progress */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-10">

        {/* Background gradient hint */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 relative z-10">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to leave? Your progress will be lost.')) {
                navigate('/documents');
              }
            }}
            className="w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all border border-slate-700 hover:border-slate-600 flex-shrink-0"
            title="Exit Quiz"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
              <Trophy className="text-yellow-500" size={28} />
              {quiz.title || "Knowledge Check"}
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isComplete ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                }`}>
                {answeredCount} Answered
              </span>
            </div>
          </div>
        </div>

        {/* Premium Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
            <span>Progress</span>
            <span className={isComplete ? 'text-emerald-400' : 'text-indigo-400'}>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-3 border border-slate-700/50 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${isComplete
                ? 'bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-linear-to-r from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                }`}
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Shimmer effect inside progress bar */}
              <div className="absolute top-0 inset-x-0 h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div
        key={currentQuestion}
        className={`bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl animate-in ${animationDirection} duration-500 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-9xl pointer-events-none select-none">
          {currentQuestion + 1}
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-white leading-relaxed mb-8 relative z-10 flex items-start justify-between gap-4">
          <span>{question.question}</span>
          <button
            onClick={handleAskAi}
            className="shrink-0 px-3 py-2 rounded-lg font-medium transition-transform hover:scale-105 active:scale-95 border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 shadow-lg shadow-indigo-500/10 flex items-center gap-1.5 text-sm whitespace-nowrap"
            title="Ask AI for explanation"
          >
            <Sparkles size={16} />
            Ask AI
          </button>
        </h2>

        {/* Options Grid */}
        <div className="grid gap-4 relative z-10">
          {question.options.map((option, idx) => {
            const isSelected = answers[currentQuestion] === option;
            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <label
                key={idx}
                className={`group flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 outline-none ${isSelected
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] translate-x-2'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 hover:shadow-lg'
                  }`}
              >
                {/* Custom Radio Button */}
                <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleChoice(option)}
                    className="peer sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${isSelected ? 'border-indigo-500' : 'border-slate-500 group-hover:border-indigo-400'
                    }`}>
                    <div className={`w-3 h-3 rounded-full bg-indigo-500 transition-transform duration-300 ${isSelected ? 'scale-100' : 'scale-0'}`}></div>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-slate-300'
                  }`}>
                  {optionLetters[idx] || idx + 1}
                </div>

                <span className={`flex-1 text-[15px] sm:text-base leading-snug transition-colors ${isSelected ? 'text-white font-medium' : 'text-slate-300'
                  }`}>
                  {option}
                </span>

                {isSelected && (
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 animate-in zoom-in duration-300">
                    <Check size={18} className="text-indigo-400" />
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handlePrev}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white rounded-xl transition-all font-semibold border border-slate-700"
        >
          <ChevronLeft size={20} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-bold shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            <span className="hidden sm:inline">Next Question</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !isComplete}
            className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all ${submitting || !isComplete
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 animate-pulse'
              }`}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <Check size={20} />
                Submit Final Answers
              </>
            )}
          </button>
        )}
      </div>

      <HelpWidget currentSessionType="quiz" />

      <AIChatModal
        isOpen={showAiChat}
        onClose={() => setShowAiChat(false)}
        title={quiz?.questions[currentQuestion]?.question || 'Quiz Question'}
        explanation={currentExplanation}
        documentId={quiz?.documentId}
        isLoading={isExplaining}
      />
    </div>
  );
};

export default QuizTakePage;
