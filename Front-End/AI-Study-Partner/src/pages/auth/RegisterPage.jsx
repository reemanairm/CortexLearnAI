import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, BrainCircuit, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authservice";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await register(username, email, password);

      if (res && (res.token || res.data?.token)) {
        toast.success("Account created successfully! 🎉 Please log in.");
        navigate("/login");
      } else {
        toast.success("Account created successfully! 🎉 Please log in.");
        navigate("/login");
      }

    } catch (err) {
      setError(err.message || "Registration failed");
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 sm:px-6 lg:px-8 py-10">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Glassmorphic Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">

          {/* Subtle top glare */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-5 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <BrainCircuit size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create Account</h1>
            <p className="text-slate-400 font-medium">
              Join CortexLearn AI to accelerate learning
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 ml-1">Username</label>
              <div className="relative group/input">
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 blur opacity-0 transition-opacity duration-300 ${focusedField === 'username' ? 'opacity-20' : ''}`}></div>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === "username" ? "text-indigo-400" : "text-slate-500 group-hover/input:text-slate-400"
                    }`} size={20} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Your name"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
              <div className="relative group/input">
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 blur opacity-0 transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-20' : ''}`}></div>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === "email" ? "text-indigo-400" : "text-slate-500 group-hover/input:text-slate-400"
                    }`} size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
              <div className="relative group/input">
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 blur opacity-0 transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-20' : ''}`}></div>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === "password" ? "text-indigo-400" : "text-slate-500 group-hover/input:text-slate-400"
                    }`} size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 ml-1">Confirm Password</label>
              <div className="relative group/input">
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 blur opacity-0 transition-opacity duration-300 ${focusedField === 'confirmPassword' ? 'opacity-20' : ''}`}></div>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === "confirmPassword" ? "text-indigo-400" : "text-slate-500 group-hover/input:text-slate-400"
                    }`} size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in shake">
                <p className="text-red-400 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-4"
            >
              <span className="absolute inset-0 bg-linear-to-r from-violet-500 via-indigo-500 to-violet-500 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient"></span>
              <div className="relative flex items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-sm px-8 py-3.5 rounded-xl transition-all duration-300 group-hover:bg-slate-900/40">
                <span className="font-bold text-white group-hover:text-white transition-colors tracking-wide">
                  {loading ? "Creating Account..." : "Sign Up"}
                </span>
                {!loading && <ArrowRight size={20} className="text-indigo-300 group-hover:translate-x-1 group-hover:text-white transition-all" />}
                {loading && <Sparkles size={20} className="text-indigo-300 animate-pulse" />}
              </div>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900/60 text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => window.location.href = `${import.meta.env.VITE_BASE_URL || 'http://localhost:8000'}/api/auth/google`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-slate-700 text-white hover:bg-white/10 transition-all duration-300 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>
          </form>

          {/* Footer Line */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 font-medium">
            <span>Already have an account?</span>
            <Link autoFocus={false} to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all">Sign in here</Link>
          </div>

        </div>

        {/* Bottom Terms */}
        <p className="text-xs text-slate-600 font-medium text-center mt-6">
          By signing up, you agree to our <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a> and <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>.
        </p>

      </div>
    </div>
  );
};

export default RegisterPage;