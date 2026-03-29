import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Eye, FileText, FileUp, Sparkles, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import documentService from '../../services/documentservice';

const DocumentListPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentService.getDocuments();
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

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const defaultTitle = file.name.replace(/\.pdf$/i, '');
      formData.append('title', defaultTitle);

      await documentService.uploadDocument(formData);
      toast.success('Document uploaded successfully! 🎉');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.error || error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      setIsDragOver(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileUpload(file);
  };

  const onFileInputChange = (e) => {
    handleFileUpload(e.target.files[0]);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={onFileInputChange}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Sparkles className="text-indigo-400" size={24} />
            </div>
            Create Study Material
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Choose a source to generate your AI study aids</p>
        </div>
      </div>

      <div className="mt-4">
        <div 
          className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] group cursor-pointer ${
            isDragOver 
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
              : 'border-slate-800 bg-slate-900/40 hover:border-indigo-500/40 hover:bg-slate-900/60'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileUp size={160} className="text-indigo-400" />
          </div>
          
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
            isDragOver ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-indigo-400'
          }`}>
            <Upload size={40} />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Upload Study Material</h2>
          <p className="text-slate-400 max-w-[350px] mx-auto mb-8 font-medium leading-relaxed">
            Drag and drop your textbooks, PDFs, or lecture notes here to generate instant AI study aids
          </p>
                   <button
            disabled={uploading}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {uploading ? 'Processing Document...' : 'Select PDF from Computer'}
          </button>

          {uploading && (
            <div className="mt-8 flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI is creating your notes</span>
            </div>
          )}
        </div>
      </div>

      {/* Study Library (Existing Documents) */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-slate-400" size={20} />
          <h2 className="text-xl font-bold text-white">Your Study Library</h2>
          <div className="h-px flex-1 bg-slate-800"></div>
          {documents.length > 0 && (
            <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-md">
              {documents.length} Items
            </span>
          )}
        </div>

        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/documents/${doc._id}`)}
                className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300 cursor-pointer flex flex-col h-full hover:-translate-y-1"
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
                  {doc.status === 'processing' ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 flex items-center gap-2">
                      <div className="w-2 h-2 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      AI Processing...
                    </span>
                  ) : doc.status === 'failed' ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-red-500/10 text-red-400 border-red-500/20">
                      Processing Failed
                    </span>
                  ) : (
                    <>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${doc.hasFlashcards ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        Flashcards
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${doc.hasQuiz ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        Quizzes
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:border-blue-500/40`}>
                        Chat Ready
                      </span>
                    </>
                  )}
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
          <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl">
            <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-300 mb-2">Your library is empty</h3>
            <p className="text-slate-500 mb-8">Start by adding a study material PDF above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentListPage;ge;