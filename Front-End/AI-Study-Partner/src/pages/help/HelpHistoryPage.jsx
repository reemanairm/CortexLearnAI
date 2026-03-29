import React, { useState, useEffect } from 'react';
import {
    HelpCircle,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    MessageSquare,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import helpService from '../../services/helpService';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const HelpHistoryPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await helpService.getMyHelpRequests();
            setRequests(response.data || []);
        } catch (error) {
            console.error('Error fetching help history:', error);
            toast.error('Failed to load help history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'resolved':
                return <CheckCircle2 className="text-emerald-400" size={18} />;
            case 'pending':
                return <Clock className="text-amber-400" size={18} />;
            default:
                return <AlertCircle className="text-slate-400" size={18} />;
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'resolved':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'pending':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    if (loading) return <Loader message="Loading your help history..." />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-8 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <HelpCircle className="text-indigo-400" size={24} />
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Help History</h1>
                        </div>
                        <p className="text-slate-400 font-medium">Track your support requests and their current status.</p>
                    </div>

                    <button
                        onClick={fetchRequests}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 flex items-center gap-2 text-sm font-bold shadow-lg"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
                {requests.length > 0 ? (
                    requests.map((request) => (
                        <div
                            key={request._id}
                            className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${getStatusStyles(request.status)} shrink-0`}>
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-bold text-white text-lg">{request.issueType}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(request.status)} flex items-center gap-1.5 capitalize`}>
                                                {getStatusIcon(request.status)}
                                                {request.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm flex items-center gap-2">
                                            <Calendar size={14} />
                                            {new Date(request.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                                    {request.sessionType}
                                </div>
                            </div>

                            {request.customIssue && (
                                <div className="mt-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap italic">
                                        "{request.customIssue}"
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 border-dashed rounded-3xl p-16 text-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                            <HelpCircle size={32} className="text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No help requests yet</h3>
                        <p className="text-slate-400 max-w-sm mx-auto">
                            If you have any issues or questions, your support requests will appear here after you submit them.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpHistoryPage;
