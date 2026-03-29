import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Star, Eye, RotateCcw, CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import flashcardService from '../../services/flashcardservice';
import aiService from '../../services/aiservice';
import Loader from '../../components/common/Loader';
import HelpWidget from '../../components/common/HelpWidget';
import AIChatModal from '../../components/common/AIChatModal';

const FlashcardPage = ({ chapterId: propChapterId, mode }) => {
  const { id } = useParams();
  const chapterId = propChapterId || useParams().chapterId; // Support both prop and URL param
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ask AI states
  const [showAiChat, setShowAiChat] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  // Timer & Revision states
  const [timeSpentOnCard, setTimeSpentOnCard] = useState(0);

  useEffect(() => {
    fetchCards();
  }, [id, chapterId]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await flashcardService.getFlashcardsForDocument(id);
      let sets = res.data || [];
      
      // Filter by chapterId if provided
      if (chapterId) {
        sets = sets.filter(s => s.chapterId === chapterId);
      }
      
      let finalCards = sets.length > 0 ? sets[0].cards : [];
      
      if (mode === 'revision') {
         finalCards = finalCards.filter(c => !c.isLearnt || c.savedForRevision);
      }
      
      setCards(finalCards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error('Failed to fetch flashcards', error);
      toast.error('Cannot load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  // Track time spent on card
  useEffect(() => {
    if (cards.length === 0) return;
    const timer = setInterval(() => {
      setTimeSpentOnCard(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, cards.length]);

  const recordTimeAndNext = useCallback(async (direction) => {
    const currentCard = cards[currentIndex];
    if (currentCard && timeSpentOnCard > 0) {
      // Fire background update for time spent and learned status
      const isLearnt = (timeSpentOnCard >= 5) || currentCard.isLearnt;
      flashcardService.reviewFlashcard(currentCard._id, {
        cardIndex: currentIndex,
        timeSpent: timeSpentOnCard,
        isLearnt
      }).catch(err => console.error('Failed to update flashcard time:', err));
      
      // Update local state without waiting
      setCards(prev => {
        const updated = [...prev];
        updated[currentIndex] = {
           ...updated[currentIndex],
           timeSpent: (updated[currentIndex].timeSpent || 0) + timeSpentOnCard,
           isLearnt
        };
        return updated;
      });
    }

    setIsFlipped(false);
    setTimeSpentOnCard(0);
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentIndex((idx) => (idx + 1) % cards.length);
      } else {
        setCurrentIndex((idx) => (idx - 1 + cards.length) % cards.length);
      }
    }, 150);
  }, [cards, currentIndex, timeSpentOnCard]);

  const nextCard = useCallback(() => recordTimeAndNext('next'), [recordTimeAndNext]);
  const prevCard = useCallback(() => recordTimeAndNext('prev'), [recordTimeAndNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (cards.length === 0) return;
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') prevCard();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards.length, nextCard, prevCard, handleFlip]);

  const currentCard = cards[currentIndex];

  const handleReview = async (e) => {
    e.stopPropagation();
    if (!currentCard) return;
    try {
      if (timeSpentOnCard < 5 && !currentCard.isLearnt) {
         toast('Spend at least 5 seconds reading the card to mark it as learned!', { icon: '⏳' });
         return;
      }
      await flashcardService.reviewFlashcard(currentCard._id, { 
         cardIndex: currentIndex, 
         timeSpent: timeSpentOnCard,
         isLearnt: true 
      });
      toast.success('Marked as learned! Great job.');
      const updated = [...cards];
      updated[currentIndex].reviewCount = (updated[currentIndex].reviewCount || 0) + 1;
      updated[currentIndex].isLearnt = true;
      updated[currentIndex].timeSpent = (updated[currentIndex].timeSpent || 0) + timeSpentOnCard;
      setCards(updated);
      setTimeSpentOnCard(0);
      nextCard();
    } catch (error) {
      console.error('Review error', error);
      toast.error('Failed to mark learned status');
    }
  };

  const handleToggleSavedForRevision = async (e) => {
    e.stopPropagation();
    if (!currentCard) return;
    try {
      const newState = !currentCard.savedForRevision;
      await flashcardService.reviewFlashcard(currentCard._id, { 
        cardIndex: currentIndex,
        savedForRevision: newState 
      });
      const updated = [...cards];
      updated[currentIndex].savedForRevision = newState;
      setCards(updated);
      if (newState) {
         toast.success('Card saved to Weaker Parts for revision', { icon: '📌' });
      } else {
         toast.success('Card removed from Weaker Parts');
      }
    } catch (error) {
      console.error('Save error', error);
      toast.error('Failed to change revision saving state');
    }
  };

  const handleToggleStar = async (e) => {
    e.stopPropagation();
    if (!currentCard) return;
    try {
      await flashcardService.toggleStar(currentCard._id);
      const updated = [...cards];
      updated[currentIndex].isStarred = !updated[currentIndex].isStarred;
      setCards(updated);
    } catch (error) {
      console.error('Star error', error);
      toast.error('Failed to star card');
    }
  };

  const handleAskAi = async (e) => {
    e.stopPropagation();
    if (!currentCard) return;

    setShowAiChat(true);
    setCurrentExplanation('');

    // If we already have an explanation, don't fetch again
    if (currentExplanation) return;

    setIsExplaining(true);
    try {
      const concept = `Explain this flashcard topic in detail. Question: "${currentCard.question}". Answer: "${currentCard.answer}". Provide a clear, educational, and engaging explanation.`;
      const res = await aiService.explainConcept(id, concept);
      setCurrentExplanation(res.data.explanation);
    } catch (error) {
      console.error('Ask AI error', error);
      toast.error('Failed to get AI explanation');
      setShowAiChat(false);
    } finally {
      setIsExplaining(false);
    }
  };

  if (loading) {
    return <Loader message="Loading flashcards..." />;
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <RotateCcw size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No flashcards found</h2>
        <p className="text-slate-400 max-w-md mb-8">Generate flashcards from the document view to start studying.</p>
        <button
          onClick={() => navigate(`/documents/${id}`)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center gap-2"
        >
          <ChevronLeft size={20} />
          Back to Document
        </button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-500 py-10">

      {/* Header & Controls */}
      <div className="w-full flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(`/documents/${id}`)}
          className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700/50 flex items-center gap-2 font-medium"
        >
          <ChevronLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex flex-col items-center flex-1 mx-4">
          <span className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 flex items-center gap-2">
            Study Mode <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          </span>
          <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-slate-500 mt-2">
            Card {currentIndex + 1} of {cards.length}
          </span>
        </div>

        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* 3D Flashcard Container */}
      <div
        className="w-full max-w-2xl h-[450px] sm:h-[400px] md:h-auto md:aspect-[3/2] perspective-[2000px] cursor-pointer group"
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
        >

          {/* Front of Card (Question) */}
          <div className="absolute inset-0 backface-hidden bg-slate-900/80 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center overflow-hidden hover:border-indigo-500/50 transition-colors">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-indigo-500 rounded-b-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>

            <div className="absolute top-6 right-6 flex gap-2">
              {currentCard.isStarred && <Star size={24} className="text-yellow-400 fill-yellow-400" />}
              {(currentCard.reviewCount > 0) && <CheckCircle2 size={24} className="text-emerald-400" />}
            </div>

            <h3 className="text-sm font-bold text-indigo-400 tracking-wider uppercase mb-6 flex items-center gap-2">
              Question
            </h3>

            <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white leading-tight">
              {currentCard.question}
            </p>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-500 font-medium text-sm animate-pulse">
              <RotateCcw size={16} /> Tap or press Space to flip
            </div>
          </div>

          {/* Back of Card (Answer) */}
          <div className="absolute inset-0 backface-hidden bg-linear-to-br from-indigo-900/90 to-slate-900/90 backdrop-blur-xl border-2 border-indigo-500/50 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center rotate-y-180 overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)]">
            <h3 className="text-sm font-bold text-indigo-300 tracking-wider uppercase mb-6 flex items-center gap-2">
              Answer
            </h3>

            <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar">
              <p className="text-xl sm:text-2xl text-slate-100 leading-relaxed max-h-full">
                {currentCard.answer}
              </p>
            </div>

            <div className="w-full flex justify-center gap-4 mt-8 pt-6 border-t border-indigo-500/20">
              <button
                onClick={handleReview}
                className={`flex flex-1 max-w-[160px] items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  (timeSpentOnCard >= 5 || currentCard.isLearnt)
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95 shadow-emerald-500/20'
                    : 'bg-emerald-500/30 text-emerald-200/50 cursor-not-allowed border border-emerald-500/20'
                }`}
                title={timeSpentOnCard < 5 && !currentCard.isLearnt ? `Must view for 5s (viewed ${timeSpentOnCard}s)` : 'Mark as learned'}
              >
                <Eye size={18} /> {currentCard.isLearnt ? 'Learned ✔' : 'Got it'}
              </button>
              
              <button
                onClick={handleToggleSavedForRevision}
                title="Feel difficult or forgetting? Save it for revision."
                className={`flex flex-1 max-w-[180px] items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 border ${
                  currentCard.savedForRevision
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 text-white'
                  }`}
              >
                <Star size={18} className={currentCard.savedForRevision ? 'fill-orange-400 text-orange-400' : ''} />
                {currentCard.savedForRevision ? 'Saved for Revision' : 'Save for Revision'}
              </button>
              <button
                onClick={handleAskAi}
                className="flex flex-1 max-w-[150px] items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 shadow-lg shadow-indigo-500/10"
              >
                <Sparkles size={18} />
                Ask AI
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-6 mt-10">
        <button
          onClick={prevCard}
          className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:-translate-x-1 shadow-lg group"
          title="Previous Card (Left Arrow)"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>

        <p className="text-sm text-slate-500 font-medium hidden sm:block">Use arrow keys to navigate</p>

        <button
          onClick={nextCard}
          className="w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-all hover:translate-x-1 shadow-[0_0_20px_rgba(99,102,241,0.4)] group"
          title="Next Card (Right Arrow)"
        >
          <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <HelpWidget currentSessionType="flashcards" />

      <AIChatModal
        isOpen={showAiChat}
        onClose={() => setShowAiChat(false)}
        title={currentCard?.question || 'Flashcard'}
        explanation={currentExplanation}
        documentId={id}
        isLoading={isExplaining}
      />

    </div>
  );
};

export default FlashcardPage;