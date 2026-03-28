import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import flashcardService from '../../services/flashcardservice';
import Loader from '../../components/common/Loader';

const FlashcardsListPage = () => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const res = await flashcardService.getAllFlashcardSets();
      setSets(res.data || []);
    } catch (error) {
      console.error('Error fetching flashcard sets:', error);
      toast.error('Failed to load flashcard sets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async (id) => {
    if (window.confirm('Delete this flashcard set?')) {
      try {
        await flashcardService.deleteFlashcardSet(id);
        toast.success('Set deleted');
        fetchSets();
      } catch (error) {
        console.error('Error deleting set:', error);
        toast.error('Failed to delete');
      }
    }
  };

  if (loading) {
    return <Loader message="Loading flashcards..." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Flashcard Sets</h1>
      {sets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <div
              key={set._id}
              className="bg-slate-800 rounded-lg p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-3">
                <ClipboardList className="text-blue-400 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-white truncate">
                    {set.documentId?.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {set.cards?.length} cards
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/documents/${set.documentId?._id}/flashcards`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition-colors"
                >
                  <Eye size={18} /> View
                </button>
                <button
                  onClick={() => handleDeleteSet(set._id)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg p-12 text-center">
          <ClipboardList size={48} className="mx-auto text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Flashcards</h2>
          <p className="text-slate-400 mb-6">Generate flashcards from documents to start studying.</p>
        </div>
      )}
    </div>
  );
};

export default FlashcardsListPage;