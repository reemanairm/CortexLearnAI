import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, BookOpen, Zap as ZapIcon, BarChart3, BrainCircuit, Shield, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to off on mobile
  const [isMobile, setIsMobile] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle Resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize(); // Check initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/documents', label: 'Documents', icon: BookOpen },
    { path: '/flashcards', label: 'Flashcards', icon: ZapIcon },
    { path: '/quizzes', label: 'Quizzes', icon: BrainCircuit },
    { path: '/help-history', label: 'Help History', icon: HelpCircle },
    // Conditionally render admin link
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin Console', icon: Shield }] : []),
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden selection:bg-indigo-500/30">

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none ${sidebarOpen ? 'w-64 translate-x-0' : isMobile ? '-translate-x-full w-64' : 'w-20 translate-x-0'
          }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 shrink-0 h-20">
          <BrainCircuit size={28} className="text-indigo-400 shrink-0" />
          <h1 className={`text-xl font-bold tracking-tight text-white whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden md:block md:w-0'}`}>
            CortexLearn AI
          </h1>
          {/* Mobile close button inside sidebar */}
          {isMobile && sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium whitespace-nowrap ${isActive
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                title={!sidebarOpen && !isMobile ? item.label : undefined}
              >
                <Icon size={20} className="shrink-0" />
                <span className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden md:block md:w-0'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
          <div className={`flex items-center gap-3 px-2 transition-all duration-300 ${sidebarOpen ? 'opacity-100 h-auto mb-2' : 'opacity-0 h-0 overflow-hidden md:opacity-100 md:h-auto md:mb-2 md:justify-center'}`}>
            {sidebarOpen ? (
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-200 truncate">{user?.username || 'Student'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'student@aistudy.app'}</p>
              </div>
            ) : (
              <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
                {user?.username?.charAt(0).toUpperCase() || 'S'}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-4' : 'justify-center md:px-0'} py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]`}
            title={!sidebarOpen && !isMobile ? 'Logout' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ml-3 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden md:block md:w-0 md:ml-0'}`}>
              Sign Out
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700/50"
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Contextual Title based on route can go here, for now simple welcome */}
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-400">Welcome back,</p>
              <p className="text-base font-bold text-white tracking-tight">{user?.username || 'Ready to study?'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick action or profile avatar */}
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-violet-500 flex items-center justify-center border-2 border-slate-800 shadow-md">
              <span className="text-sm font-bold text-white">{user?.username?.charAt(0).toUpperCase() || 'S'}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
