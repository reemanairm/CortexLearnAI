import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart3, TrendingUp, Flame, BrainCircuit, Target, CheckCircle2, Award, Upload, Sparkles as SparklesIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import HelpWidget from '../../components/common/HelpWidget';
import progressService from '../../services/progressService';
import documentService from '../../services/documentservice';
import LearningProgressPanel from './LearningProgressPanel';


const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [processingVideo, setProcessingVideo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await progressService.getDashboardData();
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    try {
      setProcessingVideo(true);
      const res = await documentService.processVideo({ videoUrl: videoUrl.trim() });
      toast.success('Video processed successfully! 🎉');
      setVideoUrl('');
      if (res.data?._id) {
        navigate(`/documents/${res.data._id}`);
      } else {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to process video');
    } finally {
      setProcessingVideo(false);
    }
  };

  if (loading) {
    return <Loader message="Analyzing your progress..." />;
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-slate-800 flex items-center justify-center">
          <Target className="text-slate-400 w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Data Available</h2>
        <p className="text-slate-400">Upload your first document to start tracking your progress.</p>
      </div>
    );
  }

  const { overview = {}, recentActivity = {} } = dashboardData;
  const recentDocs = recentActivity.documents || [];
  const recentQuizzes = recentActivity.quizzes || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Welcome Hero Section - Glassmorphic */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-600/90 to-indigo-600/90 p-8 md:p-10 border border-white/10 shadow-2xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            Welcome Back! <span className="inline-block hover:animate-spin-slow duration-700">👋</span>
          </h1>
          <p className="text-indigo-100/90 text-lg max-w-2xl font-medium">
            YourAI Study Partner  has analyzed your progress. Let's conquer your next learning milestone today. 🚀
          </p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Documents"
          value={overview.totalDocuments || 0}
          icon={<BookOpen size={28} className="text-blue-400" />}
          gradient="from-blue-500/10 to-blue-600/5"
          borderColor="border-blue-500/20"
        />
        <StatCard
          title="Flashcards Created"
          value={overview.totalFlashcards || 0}
          icon={<BrainCircuit size={28} className="text-purple-400" />}
          gradient="from-purple-500/10 to-purple-600/5"
          borderColor="border-purple-500/20"
        />
        <StatCard
          title="Quizzes Taken"
          value={overview.completedQuizzes || 0}
          icon={<CheckCircle2 size={28} className="text-emerald-400" />}
          gradient="from-emerald-500/10 to-emerald-600/5"
          borderColor="border-emerald-500/20"
        />
        <StatCard
          title="Study Streak"
          value={`${overview.studyStreak || 0} Days`}
          icon={<Flame size={28} className="text-orange-400" />}
          gradient="from-orange-500/10 to-orange-600/5"
          borderColor="border-orange-500/20"
        />
      </div>

      {/* NEW: Advanced Learning Analytics Section */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <Award className="text-indigo-400 w-8 h-8" />
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">
            Overall Learning Analysis
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Document Coverage Metric */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Document Coverage</h3>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-5xl font-black text-white">{overview.documentCoveragePercentage || 0}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="bg-linear-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${overview.documentCoveragePercentage || 0}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 blur-sm"></div>
              </div>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              You've studied <span className="text-blue-400 font-bold">{overview.coveredDocuments || 0}</span> out of <span className="text-white">{overview.totalDocuments || 0}</span> uploaded documents.
            </p>
          </div>

          {/* Flashcard Mastery Metric */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Flashcard Mastery</h3>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-5xl font-black text-white">{overview.flashcardMasteryPercentage || 0}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="bg-linear-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${overview.flashcardMasteryPercentage || 0}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 blur-sm"></div>
              </div>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              <span className="text-purple-400 font-bold">{overview.masteredFlashcards || 0}</span> concepts mastered out of <span className="text-white">{overview.totalFlashcards || 0}</span> total flashcards.
            </p>
          </div>

          {/* Concept Clarity Metric */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg hover:border-slate-700 transition-colors relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4 relative z-10">Concept Clarity</h3>
            <div className="flex items-center justify-center flex-col h-[100px] mb-2 relative z-10">
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                  <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray="301.59"
                    strokeDashoffset={301.59 - (301.59 * (overview.conceptClarity || 0)) / 100}
                    className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1500 ease-out"
                  />
                </svg>
                <span className="absolute text-3xl font-black text-white">{overview.conceptClarity || 0}%</span>
              </div>
            </div>
            <p className="text-sm text-center text-slate-400 font-medium mt-2 relative z-10">
              Based on recent quiz performance
            </p>
          </div>
        </div>
      </div>

      {/* Video to Notes Quick Access */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <BookOpen size={120} className="text-indigo-400 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <SparklesIcon className="text-indigo-400" size={24} /> 
            Instant Video to Notes
          </h2>
          <p className="text-slate-400 mb-6 max-w-xl">
            Want to study a YouTube video? Paste the link below to generate structured PDF notes, flashcards, and a quiz automatically.
          </p>
          
          <form onSubmit={handleVideoSubmit} className="flex flex-col sm:flex-row gap-4 max-w-3xl">
            <input
              type="text"
              placeholder="Paste YouTube URL here..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={processingVideo}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={processingVideo || !videoUrl.trim()}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
            >
              {processingVideo ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                'Generate Study Materials'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Learning Progress / Mastery Panel */}
      <LearningProgressPanel />

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        {/* Recent Documents */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="text-indigo-400" size={20} />
              Recent Documents
            </h2>
            <button
              onClick={() => navigate('/documents')}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {recentDocs.length > 0 ? (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/documents/${doc._id}`)}
                  className="group bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-indigo-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <BookOpen size={18} className="text-indigo-400" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                        {doc.title || doc.fileName}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {new Date(doc.lastAccessed).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-slate-600 group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl p-8 text-center border-2 border-dashed border-slate-700/50">
              <p className="text-slate-400 mb-4 font-medium">No documents yet</p>
              <button
                onClick={() => navigate('/documents')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Upload Document
              </button>
            </div>
          )}
        </div>

        {/* Recent Quizzes */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" size={20} />
              Recent Quiz Results
            </h2>
            <button
              onClick={() => navigate('/flashcards')}
              className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {recentQuizzes.length > 0 ? (
            <div className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="bg-slate-800/50 p-4 rounded-xl border border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <p className="font-semibold text-slate-200 truncate">{quiz.title}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Taken on {new Date(quiz.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-white mb-0.5">{quiz.score}%</span>
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${quiz.score >= 80 ? 'bg-emerald-500' :
                            quiz.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${quiz.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl p-8 text-center border-2 border-dashed border-slate-700/50">
              <p className="text-slate-400 mb-2 font-medium">No quiz results yet</p>
              <p className="text-sm text-slate-500">Take a quiz generated from your documents.</p>
            </div>
          )}
        </div>
      </div>

      <HelpWidget currentSessionType="dashboard" />
    </div>
  );
};

// Reusable Sub-Component for simple stats
const StatCard = ({ title, value, icon, gradient, borderColor }) => (
  <div className={`bg-linear-to-br ${gradient} rounded-2xl p-6 border ${borderColor} backdrop-blur-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-3xl font-black text-white group-hover:scale-105 origin-left transition-transform">{value}</p>
      </div>
      <div className="bg-slate-800/80 p-3 rounded-xl shadow-inner group-hover:rotate-6 transition-transform">
        {icon}
      </div>
    </div>
  </div>
);

export default DashboardPage;
