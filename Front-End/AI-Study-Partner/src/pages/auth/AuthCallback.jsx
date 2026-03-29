import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BrainCircuit, Sparkles } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const handleCallback = async () => {
      try {
        const result = await handleGoogleCallback();

        if (result.success) {
          toast.success('Successfully signed in with Google! 🚀');
          const userRole = result.user?.role;
          navigate(userRole === 'admin' ? '/admin' : '/dashboard');
        } else {
          toast.error(result.error || 'Google authentication failed');
          navigate('/login');
        }
      } catch (error) {
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    handleCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <BrainCircuit size={32} className="text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Completing Sign In...</h1>
        <div className="flex items-center justify-center gap-2">
          <Sparkles size={20} className="text-indigo-400 animate-pulse" />
          <p className="text-slate-400">Please wait while we authenticate you</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;