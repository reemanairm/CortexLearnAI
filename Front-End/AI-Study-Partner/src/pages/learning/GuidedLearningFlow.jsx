import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Zap, 
  BrainCircuit, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  Trophy,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import documentService from '../../services/documentservice';
import progressService from '../../services/progressService';
import aiService from '../../services/aiservice';
import Loader from '../../components/common/Loader';
import FlashcardPage from '../flashcards/FlashcardPage';
import QuizTakePage from '../quizzes/QuizTakePage';

const GuidedLearningFlow = () => {
  const { id, chapterId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'learning' or 'revision'
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Overview, 2: Flashcards, 3: Quiz, 4: Results
  
  const [flashcards, setFlashcards] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const docRes = await documentService.getDocumentById(id);
      const doc = docRes.data;
      setDocument(doc);

      const targetChapter = doc.chapters.find(c => c._id === chapterId);
      if (!targetChapter) {
        toast.error('Chapter not found');
        navigate(`/documents/${id}`);
        return;
      }
      setChapter(targetChapter);

      const progRes = await progressService.getChapterProgress(id);
      const chapterProg = progRes.data.find(p => p.chapterId === chapterId);
      setProgress(chapterProg);

      // If in revision mode, maybe skip to flashcards or quiz? 
      // For now, let's follow the standard flow but with revision branding.
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load learning session');
    } finally {
      setLoading(false);
    }
  }, [id, chapterId, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const startFlashcards = async () => {
    try {
      setLoading(true);
      // Check if flashcards exist for this chapter
      const res = await flashcardService.getFlashcardsForDocument(id);
      const chapterSet = res.data?.find(s => s.chapterId === chapterId);
      
      if (!chapterSet) {
        toast.loading('Generating chapter flashcards...', { id: 'gen-fc' });
        await aiService.generateFlashcards(id, { chapterId, numCards: 10 });
        toast.success('Flashcards ready!', { id: 'gen-fc' });
      }
      setStep(2);
    } catch (error) {
      toast.error('Failed to prepare flashcards', { id: 'gen-fc' });
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      setLoading(true);
      // Check if quiz exists for this chapter
      const res = await quizService.getQuizzesForDocument(id);
      let chapterQuiz = res.data?.find(q => q.chapterId === chapterId);
      
      if (!chapterQuiz) {
        toast.loading('Generating chapter quiz...', { id: 'gen-quiz' });
        const genRes = await aiService.generateQuiz(id, { chapterId, numQuestions: 5 });
        chapterQuiz = genRes.data;
        toast.success('Quiz ready!', { id: 'gen-quiz' });
      }
      setQuiz(chapterQuiz);
      setStep(3);
    } catch (error) {
      toast.error('Failed to prepare quiz', { id: 'gen-quiz' });
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) startFlashcards();
    else if (step === 2) startQuiz();
    else setStep(prev => prev + 1);
  };

  const updateProgress = async (updates) => {
    try {
      const res = await progressService.updateChapterProgress(id, chapterId, updates);
      setProgress(res.data);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const onQuizComplete = (results) => {
    setQuizResult(results);
    updateProgress({
      quizScore: results.score,
      status: results.score >= 70 ? 'completed' : 'needs_revision',
      weakTopics: results.weakTopics || []
    });
    setStep(4);
  };

  if (loading) return <Loader message="Preparing your study session..." />;

  // STEP 1: TOPIC OVERVIEW
  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => navigate(`/documents/${id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Document
        </button>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
                        <BookOpen className="text-indigo-400" size={32} />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                            Step 1 of 4: Overview
                        </span>
                        <h1 className="text-3xl font-extrabold text-white mt-3">{chapter.title}</h1>
                    </div>
                </div>

                <div className="prose prose-invert prose-indigo max-w-none mb-12">
                    <h3 className="text-xl font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">Key Concepts & Summary</h3>
                    <p className="text-lg text-slate-300 leading-relaxed italic">
                        "{chapter.summary}"
                    </p>
                    <div className="mt-8 p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                        <p className="text-slate-300 leading-relaxed">
                            {/* In a real app, we might have a longer generated overview here. 
                                For now we use the summary and a prompt to dive deeper. */}
                            This chapter covers the essential foundations of {chapter.title}. 
                            We will explore the primary definitions, examine practical examples, and 
                            solidify your understanding through interactive flashcards and a knowledge check quiz.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        updateProgress({ status: 'in_progress' });
                        startFlashcards();
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02]"
                >
                    Start Flashcards <ChevronRight size={20} />
                </button>
            </div>
        </div>
      </div>
    );
  }

  // STEP 2: FLASHCARDS (Using chapter scope)
  if (step === 2) {
    return (
        <div className="h-[calc(100vh-8rem)]">
             <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <Zap className="text-purple-400" />
                    <h2 className="font-bold text-white">Step 2: Flashcards - {chapter.title}</h2>
                </div>
                <button 
                    onClick={handleNextStep}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors"
                >
                    Continue to Quiz
                </button>
             </div>
             {/* We pass chapterId to FlashcardPage to reuse it. 
                 We need to ensure FlashcardPage can handle chapterId prop. */}
             <FlashcardPage chapterId={chapterId} />
        </div>
    );
  }

  // STEP 3: QUIZ (Using chapter scope)
  if (step === 3) {
    return (
        <div className="h-[calc(100vh-8rem)]">
             <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="text-blue-400" />
                    <h2 className="font-bold text-white">Step 3: Knowledge Check - {chapter.title}</h2>
                </div>
             </div>
             <QuizTakePage 
                quizId={quiz?._id} 
                chapterId={chapterId} 
                onComplete={onQuizComplete} 
             />
        </div>
    );
  }

  // STEP 4: RESULTS
  if (step === 4) {
    const isPassing = quizResult?.score >= 70;
    
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in zoom-in-95 duration-500">
         <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 text-center relative overflow-hidden">
            {isPassing ? (
                <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>
            ) : (
                <div className="absolute top-0 inset-x-0 h-2 bg-orange-500"></div>
            )}
            
            <div className="mb-8">
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 border-4 ${isPassing ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                    {isPassing ? (
                        <Trophy className="text-emerald-500" size={48} />
                    ) : (
                        <AlertCircle className="text-orange-500" size={48} />
                    )}
                </div>
                <h1 className="text-4xl font-black text-white mb-2">{isPassing ? 'Great Job!' : 'Keep Practicing'}</h1>
                <p className="text-slate-400 font-medium">Session complete for {chapter.title}</p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 mb-10 border border-slate-700/50 inline-block min-w-[200px]">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-1">Your Score</span>
                <span className={`text-6xl font-black ${isPassing ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {quizResult?.score}%
                </span>
            </div>

            {quizResult?.weakTopics?.length > 0 && (
                <div className="text-left mb-10 bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6">
                    <h3 className="flex items-center gap-2 font-bold text-orange-400 mb-4">
                        <Sparkles size={18} /> Recommended for Revision:
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quizResult.weakTopics.map((topic, i) => (
                            <li key={i} className="flex items-center gap-2 text-slate-300 text-sm bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                {topic}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onClick={() => navigate(`/documents/${id}`)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all border border-slate-700"
                >
                    Back to Document
                </button>
                {!isPassing && (
                    <button 
                        onClick={() => setStep(1)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                    >
                        Try Again
                    </button>
                )}
            </div>
         </div>
      </div>
    );
  }

  return null;
};

export default GuidedLearningFlow;
