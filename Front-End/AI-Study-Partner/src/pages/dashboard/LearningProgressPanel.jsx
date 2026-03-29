import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import progressService from '../../services/progressService';
import documentService from '../../services/documentservice';
import toast from 'react-hot-toast';

const LearningProgressPanel = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [chaptersProgress, setChaptersProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchChapterProgress(selectedDocId);
    }
  }, [selectedDocId]);

  const fetchDocuments = async () => {
    try {
      const res = await documentService.getDocuments();
      const docs = res.data?.documents || res.data || [];
      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0]._id);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      if (documents.length === 0) setLoading(false);
    }
  };

  const fetchChapterProgress = async (docId) => {
    try {
      setLoading(true);
      const res = await progressService.getChapterProgress(docId);
      setChaptersProgress(res.data || []);
    } catch (error) {
      console.error('Error fetching chapter progress:', error);
      toast.error('Failed to load detailed progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading && documents.length === 0) return null;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-indigo-400" /> Topic Mastery
          </h2>
          <p className="text-slate-400 text-sm mt-1">Track your progress across chapters and topics</p>
        </div>

        <select 
          value={selectedDocId || ''} 
          onChange={(e) => setSelectedDocId(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[200px]"
        >
          {documents.map(doc => (
            <option key={doc._id} value={doc._id}>{doc.title || doc.fileName}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 animate-pulse">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading chapter data...</p>
        </div>
      ) : chaptersProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chaptersProgress.map((chapter) => (
            <div 
              key={chapter.chapterId}
              className="group bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/30 transition-all hover:bg-slate-800/60"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-2">
                  <h3 className="font-bold text-white text-[15px] mb-1 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {chapter.chapterTitle}
                  </h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    chapter.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    chapter.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {chapter.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>
                {chapter.status === 'completed' ? (
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                ) : chapter.status === 'in_progress' ? (
                  <Clock className="text-indigo-400 shrink-0" size={20} />
                ) : (
                  <Circle className="text-slate-600 shrink-0" size={20} />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-500 font-bold uppercase">Flashcards</span>
                      <span className="text-indigo-400 font-bold">{chapter.flashcardsReviewed || 0} learnt</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-indigo-500 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                         style={{ width: `${Math.min(100, ((chapter.flashcardsReviewed || 0) / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-500 font-bold uppercase">Quiz Mastery</span>
                      <span className={`font-black ${chapter.quizScore >= 70 ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {chapter.quizScore || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div 
                         className={`h-full rounded-full transition-all duration-700 ${chapter.quizScore >= 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'}`}
                         style={{ width: `${chapter.quizScore || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {chapter.weakTopics?.length > 0 && (
                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertCircle size={10} /> Needs Revision:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {chapter.weakTopics.slice(0, 3).map((topic, i) => (
                        <span key={topic} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50">
                          {topic}
                        </span>
                      ))}
                      {chapter.weakTopics.length > 3 && (
                        <span className="text-[10px] text-slate-500 font-bold">+{chapter.weakTopics.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/documents/${selectedDocId}/learning/${chapter.chapterId}`)}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all border border-slate-700 hover:border-indigo-500 shadow-sm"
                >
                  Continue Learning <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-3xl p-12 text-center border-2 border-dashed border-slate-700/50">
          <BrainCircuit className="text-slate-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-300 mb-2">No Chapters Detected Yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Upload a structured document or video to see topic-wise progress here.</p>
        </div>
      )}

      {/* Recommended Revision Section Footer */}
      {chaptersProgress.some(p => p.status === 'needs_revision' || (p.quizScore > 0 && p.quizScore < 70)) && (
          <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Sparkles size={20} className="text-orange-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-300">
                      We've identified <span className="text-orange-400 font-bold">concepts</span> you might want to revisit to improve your mastery.
                  </p>
              </div>
              <button 
                onClick={() => navigate(`/documents/${selectedDocId}`)}
                className="text-indigo-400 hover:text-white text-sm font-bold flex items-center gap-1 transition-colors"
              >
                  Review Suggestions <ChevronRight size={16} />
              </button>
          </div>
      )}
    </div>
  );
};

export default LearningProgressPanel;
