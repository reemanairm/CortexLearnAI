import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Sparkles, BrainCircuit } from "lucide-react";
import toast from "react-hot-toast";
import authService from "../../services/authservice";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
      toast.success("Password reset email sent! 📧");
    } catch (err) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 sm:px-6 lg:px-8">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <Mail size={32} className="text-green-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Check Your Email</h1>
              <p className="text-slate-400 font-medium mb-6">
                We've sent a password reset link to <strong className="text-indigo-400">{email}</strong>
              </p>
              <p className="text-sm text-slate-500 mb-8">
                The link will expire in 10 minutes. If you don't see it, check your spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <BrainCircuit size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Forgot Password?</h1>
            <p className="text-slate-400 font-medium">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
              <div className="relative group/input">
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 blur opacity-0 transition-opacity duration-300`}></div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 text-indigo-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-2"
            >
              <span className="absolute inset-0 bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient"></span>
              <div className="relative flex items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-sm px-8 py-3.5 rounded-xl transition-all duration-300 group-hover:bg-slate-900/40">
                <span className="font-bold text-white group-hover:text-white transition-colors tracking-wide">
                  {loading ? "Sending..." : "Send Reset Link"}
                </span>
                {!loading && <Sparkles size={20} className="text-indigo-300 group-hover:text-white transition-all" />}
                {loading && <Sparkles size={20} className="text-indigo-300 animate-pulse" />}
              </div>
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400 font-medium">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all flex items-center gap-1">
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;