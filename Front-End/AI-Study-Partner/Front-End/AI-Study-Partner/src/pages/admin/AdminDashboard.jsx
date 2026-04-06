import React, { useState, useEffect } from 'react';
import {
    Users,
    FileText,
    HelpCircle,
    BarChart3,
    Trash2,
    Search,
    BrainCircuit,
    AlertCircle,
    Eye,
    CheckCircle2,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import Loader from '../../components/common/Loader';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data states
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [helpRequests, setHelpRequests] = useState([]);

    // Search states
    const [userSearch, setUserSearch] = useState('');
    const [docSearch, setDocSearch] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [statsRes, usersRes, docsRes, helpRes] = await Promise.all([
                adminService.getStats(),
                adminService.getUsers(),
                adminService.getDocuments(),
                adminService.getHelpRequests()
            ]);

            setStats(statsRes.data);
            setUsers(usersRes.data);
            setDocuments(docsRes.data);
            setHelpRequests(helpRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Failed to load admin dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This will erase all their documents, flashcards, and quizzes permanently.')) {
            try {
                await adminService.deleteUser(userId);
                setUsers(users.filter(u => u._id !== userId));
                toast.success('User deleted successfully');
                // Refresh stats
                const newStats = await adminService.getStats();
                setStats(newStats.data);
            } catch (error) {
                toast.error('Failed to delete user');
            }
        }
    };

    const handleDeleteDoc = async (docId) => {
        if (window.confirm('Are you sure you want to delete this document? All associated AI context will be lost.')) {
            try {
                await adminService.deleteDocument(docId);
                setDocuments(documents.filter(d => d._id !== docId));
                toast.success('Document deleted successfully');
                // Refresh stats
                const newStats = await adminService.getStats();
                setStats(newStats.data);
            } catch (error) {
                toast.error('Failed to delete document');
            }
        }
    };

    const handleResolveTicket = async (ticketId) => {
        try {
            await adminService.resolveHelpRequest(ticketId);
            setHelpRequests(helpRequests.map(ticket =>
                ticket._id === ticketId ? { ...ticket, status: 'resolved' } : ticket
            ));
            toast.success('Ticket marked as resolved');
            // Refresh stats to update pending count
            const newStats = await adminService.getStats();
            setStats(newStats.data);
        } catch (error) {
            toast.error('Failed to resolve ticket');
        }
    };

    if (loading) return <Loader message="Loading Admin Dashboard..." />;

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredDocs = documents.filter(d =>
        (d.fileName || d.title || '').toLowerCase().includes(docSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Admin Header */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-fuchsia-500/20 rounded-xl">
                                <BrainCircuit className="text-fuchsia-400" size={24} />
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Console</h1>
                        </div>
                        <p className="text-slate-400 font-medium">Manage users, monitor platform health, and resolve tickets.</p>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchAllData}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 text-sm font-bold"
                    >
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 custom-scrollbar">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={18} />} label="Overview" />
                <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="Users" count={users.length} />
                <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FileText size={18} />} label="Documents" count={documents.length} />
                <TabButton active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} icon={<HelpCircle size={18} />} label="Help Tickets" count={helpRequests.length} alert={helpRequests.filter(r => r.status === 'pending').length > 0} />
            </div>

            {/* Tab Content Areas */}

            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                        <StatCard
                            title="Total Users"
                            value={stats?.totalUsers || 0}
                            icon={<Users size={28} className="text-blue-400" />}
                            gradient="from-blue-500/10 to-blue-600/5"
                        />
                        <StatCard
                            title="Total Documents"
                            value={stats?.totalDocuments || 0}
                            icon={<FileText size={28} className="text-indigo-400" />}
                            gradient="from-indigo-500/10 to-indigo-600/5"
                        />
                        <StatCard
                            title="Total Quizzes"
                            value={stats?.totalQuizzes || 0}
                            icon={<BrainCircuit size={28} className="text-purple-400" />}
                            gradient="from-purple-500/10 to-purple-600/5"
                        />
                        <StatCard
                            title="Open Tickets"
                            value={stats?.pendingTickets || 0}
                            icon={<AlertCircle size={28} className={(stats?.pendingTickets || 0) > 0 ? "text-red-400" : "text-emerald-400"} />}
                            gradient={(stats?.pendingTickets || 0) > 0 ? "from-red-500/10 to-red-600/5" : "from-emerald-500/10 to-emerald-600/5"}
                            alert={(stats?.pendingTickets || 0) > 0}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock size={18} className="text-slate-400" /> Recent Signups</h3>
                            <div className="space-y-3">
                                {users.slice(0, 5).map(u => (
                                    <div key={u._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{u.username.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-200">{u.username}</p>
                                                <p className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${u.role === 'admin' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-slate-700 text-slate-400'}`}>{u.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><HelpCircle size={18} className="text-red-400" /> Action Required</h3>
                            {helpRequests.filter(r => r.status === 'pending').length > 0 ? (
                                <div className="space-y-3">
                                    {helpRequests.filter(r => r.status === 'pending').slice(0, 5).map(r => (
                                        <div key={r._id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                                            <p className="text-sm font-bold text-slate-200 mb-1">{r.issueType}</p>
                                            <p className="text-xs text-slate-500">From User: {r.userId?.username || 'Unknown'}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-32 flex flex-col items-center justify-center text-slate-500">
                                    <CheckCircle2 size={32} className="mb-2 opacity-50 text-emerald-500" />
                                    <p className="text-sm font-medium">All caught up! No open tickets.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. USERS TAB */}
            {activeTab === 'users' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
                    <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={20} className="text-blue-400" /> User Directory</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="w-full sm:w-64 bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Joined</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-200">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${user.role === 'admin' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(user._id)}
                                                disabled={user.role === 'admin'}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                title={user.role === 'admin' ? "Cannot delete admins" : "Delete User"}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-500">No users found matching "{userSearch}"</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. DOCUMENTS TAB */}
            {activeTab === 'documents' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
                    <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileText size={20} className="text-indigo-400" /> Platform Documents</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={docSearch}
                                onChange={e => setDocSearch(e.target.value)}
                                className="w-full sm:w-64 bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4">File Name</th>
                                    <th className="p-4">Owner</th>
                                    <th className="p-4">Pages</th>
                                    <th className="p-4">Uploaded</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                                    <tr key={doc._id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3 max-w-[250px]">
                                                <FileText size={18} className="text-indigo-400 shrink-0" />
                                                <span className="font-semibold text-slate-200 truncate" title={doc.fileName || doc.title}>{doc.fileName || doc.title}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">{doc.userId?.username || 'Unknown'}</td>
                                        <td className="p-4 text-sm text-slate-400">{doc.pageCount || '?'}</td>
                                        <td className="p-4 text-sm text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDeleteDoc(doc._id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Delete Document"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-500">No documents found matching "{docSearch}"</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4. HELP TICKETS TAB */}
            {activeTab === 'tickets' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
                    <div className="p-4 sm:p-6 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><HelpCircle size={20} className="text-orange-400" /> Support Tickets</h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                        {helpRequests.length > 0 ? helpRequests.map(ticket => (
                            <div key={ticket._id} className={`p-5 rounded-2xl border transition-all ${ticket.status === 'open' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-slate-800/30 border-slate-800'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${ticket.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md uppercase">
                                                {ticket.sessionType}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-200 mt-2">{ticket.issueType}</h3>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm font-medium text-slate-300">User: {ticket.userId?.username || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {ticket.customIssue && (
                                    <div className="mt-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{ticket.customIssue}</p>
                                    </div>
                                )}

                                {ticket.status === 'pending' && (
                                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-end">
                                        <button
                                            onClick={() => handleResolveTicket(ticket._id)}
                                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle2 size={16} /> Mark Resolved
                                        </button>
                                        {/* Note: In a complete implementation, this button would call an adminService endpoint to update the ticket status */}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-12 text-slate-500">
                                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-medium text-lg">No help tickets found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

// UI Components
const TabButton = ({ active, onClick, icon, label, count, alert }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 relative ${active
            ? 'bg-slate-800 shadow-md text-white border border-slate-700'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
    >
        {icon}
        <span>{label}</span>
        {count !== undefined && (
            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${active ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {count}
            </span>
        )}
        {alert && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        )}
    </button>
);

const StatCard = ({ title, value, icon, gradient, alert }) => (
    <div className={`bg-slate-900/40 rounded-2xl p-6 border ${alert ? 'border-red-500/30' : 'border-slate-800'} backdrop-blur-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
        <div className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
        <div className="flex items-start justify-between relative z-10">
            <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
                <p className="text-3xl font-black text-white">{value}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl shadow-inner">
                {icon}
            </div>
        </div>
    </div>
);

export default AdminDashboard;
