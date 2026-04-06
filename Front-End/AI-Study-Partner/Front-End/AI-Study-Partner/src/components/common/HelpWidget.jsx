import React, { useState } from 'react';
import { HelpCircle, X, Send, AlertCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import helpService from '../../services/helpService';

const HelpWidget = ({ currentSessionType = "other" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [issueType, setIssueType] = useState('');
    const [customIssue, setCustomIssue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const predefinedIssues = {
        flashcards: ["Flashcards not generating", "Incorrect answers in flashcards", "Cannot flip cards"],
        quiz: ["Quiz not generating", "Questions are too hard/easy", "Score not saving", "Options are blank"],
        summary: ["Summary is too short/long", "Summary completely wrong", "Summary failed to generate"],
        chatbot: ["Chatbot unresponsive", "Chatbot gives irrelevant answers"],
        dashboard: ["Stats are incorrect", "Documents not loading"],
        other: ["Website crashed", "UI is broken", "Login/Logout issues"]
    };

    // Get options for current session, fallback to 'other' if not found
    const options = predefinedIssues[currentSessionType] || predefinedIssues.other;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!issueType) {
            toast.error('Please select an issue type');
            return;
        }

        if (issueType === 'Others' && !customIssue.trim()) {
            toast.error('Please describe your issue');
            return;
        }

        try {
            setIsSubmitting(true);
            await helpService.submitHelpRequest({
                sessionType: currentSessionType,
                issueType,
                customIssue: issueType === 'Others' ? customIssue : ''
            });

            toast.success('Help ticket submitted. An admin will review it soon.');
            setIsOpen(false);
            setIssueType('');
            setCustomIssue('');
        } catch (error) {
            console.error('Error submitting ticket:', error);
            toast.error(error.message || 'Failed to submit help ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Button Container - relative parent handles positioning for both icon and text */}
            <div
                className="fixed bottom-6 right-6 z-50 flex items-center justify-end"
            >
                <button
                    onClick={() => setIsOpen(true)}
                    className={`flex items-center justify-center p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 border 
          ${isOpen ? 'bg-slate-800 text-slate-400 border-slate-700 pointer-events-none opacity-0 scale-90' : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 hover:shadow-indigo-500/30'}`}
                    title="Need Help?"
                >
                    <HelpCircle size={28} />
                </button>
            </div>

            {/* Modal Overlay & Content */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <MessageSquare className="text-indigo-400" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Report an Issue</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-6">

                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle size={16} className="text-slate-400" />
                                    <label className="text-sm font-medium text-slate-300">What went wrong?</label>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">Context: <span className="text-indigo-400 font-semibold capitalize">{currentSessionType}</span></p>

                                <div className="space-y-2">
                                    {options.map((opt, idx) => (
                                        <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${issueType === opt ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600'}`}>
                                            <div className="flex-shrink-0 mt-0.5">
                                                <input
                                                    type="radio"
                                                    name="issueType"
                                                    value={opt}
                                                    checked={issueType === opt}
                                                    onChange={(e) => setIssueType(e.target.value)}
                                                    className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                                />
                                            </div>
                                            <span className="text-sm font-medium leading-tight">{opt}</span>
                                        </label>
                                    ))}

                                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${issueType === 'Others' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600'}`}>
                                        <div className="flex-shrink-0 mt-0.5">
                                            <input
                                                type="radio"
                                                name="issueType"
                                                value="Others"
                                                checked={issueType === 'Others'}
                                                onChange={(e) => setIssueType(e.target.value)}
                                                className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                            />
                                        </div>
                                        <span className="text-sm font-medium leading-tight">Others (Write your own)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Custom Issue TextBox */}
                            {issueType === 'Others' && (
                                <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Describe the problem</label>
                                    <textarea
                                        value={customIssue}
                                        onChange={(e) => setCustomIssue(e.target.value)}
                                        placeholder="Provide details so we can fix it..."
                                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none h-24 transition-all"
                                    ></textarea>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !issueType || (issueType === 'Others' && !customIssue.trim())}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/50"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Ticket
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpWidget;
