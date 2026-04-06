import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Sparkles, BrainCircuit, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import authService from "../../services/authservice";

const ResetPasswordPage = () => {
  const { resettoken } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(resettoken, password);
      toast.success("Password reset successful! 🎉");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Reset Password</h1>
            <p className="text-slate-400 font-medium">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">New Password</label>
              <div className="relative group/input">
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 blur opacity-0 transition-opacity duration-300`}></div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 text-indigo-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Confirm Password</label>
              <div className="relative group/input">
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 blur opacity-0 transition-opacity duration-300`}></div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 text-indigo-400" size={20} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in shake">
                <p className="text-red-400 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-2"
            >
              <span className="absolute inset-0 bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient"></span>
              <div className="relative flex items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-sm px-8 py-3.5 rounded-xl transition-all duration-300 group-hover:bg-slate-900/40">
                <span className="font-bold text-white group-hover:text-white transition-colors tracking-wide">
                  {loading ? "Resetting..." : "Reset Password"}
                </span>
                {!loading && <Sparkles size={20} className="text-indigo-300 group-hover:text-white transition-all" />}
                {loading && <Sparkles size={20} className="text-indigo-300 animate-pulse" />}
              </div>
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400 font-medium">
            <button
              onClick={() => navigate("/login")}
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;