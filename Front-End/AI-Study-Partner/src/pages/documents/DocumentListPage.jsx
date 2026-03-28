import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Eye, FileText, FileUp, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import documentService from '../../services/documentservice';

const DocumentListPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [processingVideo, setProcessingVideo] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentService.getDocuments();
      // Ensure we extract the array properly depending on the response structure
      const docsArray = res.data?.documents || res.data || [];
      setDocuments(Array.isArray(docsArray) ? docsArray : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      // include a title so backend validation passes; default to filename without extension
      const defaultTitle = file.name.replace(/\.pdf$/i, '');
      formData.append('title', defaultTitle);

      await documentService.uploadDocument(formData);
      toast.success('Document uploaded successfully! 🎉');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      setIsDragOver(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to process video');
    } finally {
      setProcessingVideo(false);
    }
  };

  const onFileInputChange = (e) => {
    handleFileUpload(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileUpload(file);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm('Are you sure you want to delete this document? All associated flashcards and quizzes will also be deleted.')) {
      try {
        await documentService.deleteDocument(id);
        toast.success('Document deleted');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      }
    }
  };

  if (loading) {
    return <Loader message="Loading your library..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 min-h-[80vh]">

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <FileText className="text-indigo-400" size={24} />
            </div>
            Study Library
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage and generate content from your PDFs</p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || processingVideo}
          className="group relative overflow-hidden rounded-xl p-[1px] shrink-0"
        >
          <span className="absolute inset-0 bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient"></span>
          <div className="relative flex items-center justify-center gap-2 bg-slate-900/90 backdrop-blur-sm px-6 py-2.5 rounded-xl transition-all duration-300 group-hover:bg-slate-900/40">
            {uploading ? (
              <>
                <Sparkles size={18} className="text-indigo-300 animate-pulse" />
                <span className="font-bold text-white tracking-wide">Processing...</span>
              </>
            ) : (
              <>
                <FileUp size={18} className="text-indigo-300 group-hover:-translate-y-1 transition-transform" />
                <span className="font-bold text-white tracking-wide">Upload PDF</span>
              </>
            )}
          </div>
        </button>
      </div>

      {uploading && (
        <div className="w-full bg-slate-800 rounded-2xl p-6 border border-indigo-500/30 flex flex-col items-center justify-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-full border-b-2 border-indigo-500 animate-spin"></div>
          <p className="text-indigo-300 font-semibold tracking-wide">Analyzing document and extracting content...</p>
        </div>
      )}

      {/* Documents Grid or Empty State */}
      {!uploading && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc._id}
              onClick={() => navigate(`/documents/${doc._id}`)}
              className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all duration-300 cursor-pointer flex flex-col h-full hover:-translate-y-1"
            >
              {/* Card Header */}
              <div className="p-6 pb-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/10 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="text-indigo-400" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                    {doc.fileName || doc.filename || doc.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md text-slate-300 font-semibold">
                      <FileText size={12} /> {(doc.pageCount || 0)} pages
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="px-6 py-3 flex gap-2 flex-wrap flex-grow">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${doc.hasFlashcards ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                  Flashcards
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${doc.hasQuiz ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                  Quizzes
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:border-blue-500/40`}>
                  Chat Ready
                </span>
              </div>

              {/* Actions Footer */}
              <div className="mt-auto border-t border-slate-800 bg-slate-800/20 p-4 flex gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc._id}`); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Eye size={18} />
                  Open
                </button>
                <button
                  onClick={(e) => handleDelete(doc._id, e)}
                  className="flex items-center justify-center bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 py-2.5 px-4 rounded-xl border border-slate-700 hover:border-red-500/30 transition-all"
                  title="Delete Document"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !uploading && (
        <div
          className={`mt-8 relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] ${isDragOver
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
              : 'border-slate-700 hover:border-indigo-400/50 hover:bg-slate-800/50'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isDragOver ? 'bg-indigo-500 scale-110 shadow-[0_0_40px_rgba(99,102,241,0.5)]' : 'bg-slate-800'
            }`}>
            <Upload size={40} className={isDragOver ? 'text-white' : 'text-slate-400'} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {isDragOver ? 'Drop PDF Here' : 'Drag & Drop your PDF'}
          </h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8 font-medium">
            Upload a textbook, lecture slides, or study guide to instantly generate flashcards, quizzes, and chat with your content.
          </p>
          <button
            disabled={uploading || processingVideo}
            className="group relative overflow-hidden rounded-xl p-[1px] cursor-pointer"
          >
            <span className="absolute inset-0 bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient"></span>
            <div className="relative flex items-center justify-center gap-2 bg-slate-900 backdrop-blur-sm px-8 py-3.5 rounded-xl transition-all duration-300 group-hover:bg-slate-900/40">
              <span className="font-bold text-white tracking-wide">Browse Files</span>
            </div>
          </button>
        </div>
      )}

      {/* Video to Notes Input Section */}
      <div className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 mt-8">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="text-indigo-400" /> Video to Notes
        </h2>
        <p className="text-slate-400 mb-6">Paste a YouTube video link to automatically generate structured study notes and learning materials.</p>
        <form onSubmit={handleVideoSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={processingVideo || uploading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={processingVideo || uploading || !videoUrl.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {processingVideo ? 'Processing...' : 'Generate Notes'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default DocumentListPage;