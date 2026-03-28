import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Zap,
  BookOpen,
  MessageCircle,
  ArrowLeft,
  Copy,
  Check,
  FileText,
  BrainCircuit,
  Sparkles,
  Bot,
  Eye,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import documentService from '../../services/documentservice';
import aiService from '../../services/aiservice';
import Loader from '../../components/common/Loader';
import HelpWidget from '../../components/common/HelpWidget';
import { BASE_URL } from '../../utils/apiPaths';

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // user-configurable requirements
  const [flashcardQty, setFlashcardQty] = useState(10);
  const [quizQty, setQuizQty] = useState(5);
  const [quizDifficultyPct, setQuizDifficultyPct] = useState(50); // 0-100 range
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDocument();
    fetchChatHistory();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await documentService.getDocumentById(id);
      // backend returns fileName (camelCase) – normalize for UI
      setDocument(res.data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await aiService.getChatHistory(id);
      setChatHistory(res.data || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setChatLoading(true);

    try {
      // Optimistic user message append
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: userMessage }
      ]);

      const res = await aiService.chat(id, userMessage);

      // Append assistant message
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.answer }
      ]);
      
      // Fetch fresh history to get MongoDB _id for new messages (needed for Edit/Delete)
      await fetchChatHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // If error, we might want to pop the user message, but keeping it simple for now
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all chat history for this document?')) return;
    try {
      setChatLoading(true);
      await aiService.deleteChatHistory(id);
      setChatHistory([]);
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat history');
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      setChatLoading(true);
      const res = await aiService.deleteChatMessage(id, messageId);
      setChatHistory(res.data || []);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setChatLoading(false);
    }
  };

  const startEditMessage = (msg) => {
    setEditingMessageId(msg._id);
    setEditContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const submitEditMessage = async (messageId) => {
    if (!editContent.trim()) {
      cancelEdit();
      return;
    }
    
    try {
      setChatLoading(true);
      const res = await aiService.editChatMessage(id, messageId, editContent.trim());
      setChatHistory(res.data || []);
      toast.success('Message updated');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    } finally {
      setChatLoading(false);
      cancelEdit();
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await aiService.generateSummary(id);
      setSummary(res.data.summary);
      setShowSummary(true);
      toast.success('Summary generated! ✨');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      if (flashcardQty < 1) {
        toast.error('Please enter at least 1 flashcard');
        return;
      }
      setIsGenerating(true);
      await aiService.generateFlashcards(id, { numCards: flashcardQty });
      toast.success('Flashcards generated successfully! 🎉');
      setTimeout(() => navigate(`/documents/${id}/flashcards`), 1000);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      const msg = error.error || error.message || 'Failed to generate flashcards';
      toast.error(msg);
      setIsGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      if (quizQty < 1) {
        toast.error('Please enter at least 1 question');
        return;
      }

      // Map percentage to string difficulty for backend
      let diffString = "medium";
      if (quizDifficultyPct < 45) diffString = "easy";
      else if (quizDifficultyPct > 85) diffString = "hard";

      setIsGenerating(true);
      const res = await aiService.generateQuiz(id, {
        numQuestions: quizQty,
        difficulty: diffString
      });

      toast.success('Quiz generated successfully! 🎯');
      setTimeout(() => navigate(`/quizzes/${res.data._id}`), 1000);
    } catch (error) {
      console.error('Error generating quiz:', error);
      const msg = error.error || error.message || 'Failed to generate quiz';
      toast.error(msg);
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopiedToClipboard(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  if (loading || isGenerating) {
    return <Loader message={isGenerating ? "AI is generating content..." : "Loading document..."} />;
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileText size={64} className="text-slate-700 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Document not found</h2>
        <p className="text-slate-400 mb-8 max-w-sm">The document you're looking for might have been deleted or never existed.</p>
        <button
          onClick={() => navigate('/documents')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-8rem)] pb-10 lg:pb-0 animate-in fade-in duration-500">

      {/* Left Sidebar: Document Info & AI Actions */}
      <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6 lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar lg:shrink-0">

        {/* Document Header Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700"></div>

          <button
            onClick={() => navigate('/documents')}
            className="w-10 h-10 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-full mb-6 transition-all border border-slate-700/50"
            title="Back to Documents"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-linear-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 rounded-2xl flex-shrink-0">
              <FileText className="text-indigo-400" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight break-words">{document.fileName || document.filename}</h1>
              <p className="text-sm font-medium text-slate-400 mt-1">{document.pageCount} Pages • PDF format</p>
            </div>
          </div>

          <a
            href={document.filePath || `${BASE_URL}/uploads/documents/${document.fileName || document.filename}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
          >
            <Eye size={18} className="text-slate-400" />
            Open Original PDF
          </a>
        </div>

        {/* AI Actions */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-2 mb-4">AI Generation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">

            {/* Summary button */}
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="w-full group relative overflow-hidden bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] text-left"
            >
              <div className={`p-3 rounded-xl transition-colors ${summaryLoading ? 'bg-emerald-500/20' : 'bg-slate-800 group-hover:bg-emerald-500/20'}`}>
                {summaryLoading ? <Sparkles className="text-emerald-400 animate-spin" size={24} /> : <BookOpen className="text-emerald-400" size={24} />}
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {summaryLoading ? 'Generating...' : 'Smart Summary'}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Extract key concepts instantly</p>
              </div>
            </button>

            {/* Flashcards with quantity input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={flashcardQty}
                onChange={(e) => setFlashcardQty(Number(e.target.value))}
                className="w-20 p-2 rounded-md bg-slate-800 text-white text-sm"
                title="Number of flashcards"
              />
              <button
                onClick={handleGenerateFlashcards}
                className="w-full group flex-1 bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-purple-500/30 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)] text-left"
              >
                <div className="p-3 bg-slate-800 group-hover:bg-purple-500/20 rounded-xl transition-colors">
                  <Zap className="text-purple-400" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors">Generate Flashcards</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Create {flashcardQty} bite-sized cards</p>
                </div>
              </button>
            </div>

            {/* Quiz with quantity & difficulty input */}
            <div className="flex flex-col gap-3 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] group">
              <div className="flex items-center gap-4 cursor-pointer" onClick={handleGenerateQuiz}>
                <div className="p-3 bg-slate-800 group-hover:bg-blue-500/20 rounded-xl transition-colors">
                  <BrainCircuit className="text-blue-400" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-blue-300 transition-colors">Generate Quiz</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Test knowledge with {quizQty} questions</p>
                </div>
              </div>

              <div className="pl-2 pr-2 pt-2 border-t border-slate-800/50 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quizQty}
                    onChange={(e) => setQuizQty(Number(e.target.value))}
                    className="w-16 p-1 rounded-md bg-slate-800 text-white text-xs text-center border border-slate-700"
                    title="Number of quiz questions"
                  />
                </div>

                <div className="mb-1 mt-3 flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-medium pb-1">Easy</span>
                  <span className="text-orange-400 font-bold">{quizDifficultyPct}%</span>
                  <span className="text-red-400 font-medium pb-1">Hard</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quizDifficultyPct}
                  onChange={(e) => setQuizDifficultyPct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  title="Slide to set difficulty"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Area: Chat & Summary */}
      <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 h-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

        {/* Floating background blobs for chat area */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* If showing summary, overlay it on top */}
        {showSummary && summary && (
          <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-md p-6 sm:p-10 overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Sparkles className="text-emerald-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">AI Summary</h2>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 focus:ring-2 focus:ring-emerald-500/50"
                    title="Copy to clipboard"
                  >
                    {copiedToClipboard ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                  </button>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors border border-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="prose prose-invert prose-emerald max-w-none prose-p:leading-relaxed prose-p:text-slate-300 prose-headings:text-white pb-10">
                {/* Basic formatting assuming AI might return some markdown or just plain text */}
                {summary.split('\n').map((para, i) => (
                  para.trim() ? <p key={i} className="mb-4 text-lg">{para}</p> : <br key={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="text-indigo-400" size={24} />
            <div>
              <h2 className="font-bold text-white">Document Chat</h2>
              <p className="text-xs text-slate-400">Ask questions about the text</p>
            </div>
          </div>
          {chatHistory.length > 0 && (
            <button 
              onClick={handleClearChat}
              disabled={chatLoading}
              className="text-xs flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
            >
              <Trash2 size={14} /> Clear Chat
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth custom-scrollbar relative z-10">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto opacity-70">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20 animate-bounce-slow">
                <MessageCircle size={40} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Start a conversation</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                I've studied this document. Ask me to explain concepts, summarize sections, or clarify anything you don't understand.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 fade-in duration-300 group`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex flex-shrink-0 items-center justify-center border border-indigo-500/30 mr-3 mt-1 shadow-sm shadow-indigo-500/20">
                      <Bot size={16} className="text-indigo-300" />
                    </div>
                  )}
                  {isUser && editingMessageId === msg._id ? (
                    <div className="max-w-[85%] lg:max-w-[75%] w-full">
                      <div className="bg-slate-800 border border-indigo-500/50 p-3 rounded-2xl shadow-lg">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-transparent text-white outline-none resize-none text-[15px] custom-scrollbar"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                            <X size={16} />
                          </button>
                          <button onClick={() => submitEditMessage(msg._id)} className="p-1.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors">
                            <Check size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end max-w-[85%] lg:max-w-[75%]">
                      <div
                        className={`px-5 py-3.5 ${isUser
                          ? 'bg-linear-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-indigo-500/25'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-sm shadow-md'
                          }`}
                      >
                        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isUser ? 'font-medium' : ''}`}>
                          {msg.content}
                        </p>
                      </div>
                      
                      {isUser && msg._id && !chatLoading && (
                        <div className="flex gap-2 mt-1 transition-opacity">
                          <button onClick={() => startEditMessage(msg)} className="text-slate-400 hover:text-indigo-400 p-1 bg-slate-800/50 rounded-md" title="Edit message">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteMessage(msg._id)} className="text-slate-400 hover:text-red-400 p-1 bg-slate-800/50 rounded-md" title="Delete message">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {chatLoading && (
            <div className="flex justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex flex-shrink-0 items-center justify-center border border-indigo-500/30 mr-3 mt-1 shadow-sm">
                <Bot size={16} className="text-indigo-300" />
              </div>
              <div className="bg-slate-800 border border-slate-700 px-5 py-4 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-2">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} className="h-2" />
        </div>

        {/* Chat Input Area */}
        <div className="p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md border-t border-slate-800/50 relative z-10">
          <form onSubmit={handleChat} className="relative flex items-center max-w-4xl mx-auto">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={chatLoading}
              className="w-full bg-slate-950/80 border border-slate-700 text-white pl-6 pr-16 py-4 rounded-2xl outline-none focus:border-indigo-500/50 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder-slate-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!message.trim() || chatLoading}
              className={`absolute right-2 p-2.5 rounded-xl flex items-center justify-center transition-all ${message.trim() && !chatLoading
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-105 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : 'bg-slate-800 text-slate-500'
                }`}
            >
              <Send size={20} className={message.trim() && !chatLoading ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">AI can make mistakes. Consider verifying important information.</p>
          </div>
        </div>
      </div>

      <HelpWidget currentSessionType="chatbot" />
    </div>
  );
};

export default DocumentDetailPage;