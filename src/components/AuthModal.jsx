import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BACKEND_API } from '../config';
import { X, User, Lock, Mail, LogIn, UserPlus, LogOut, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { user, login, register, logout, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authentikConfigured, setAuthentikConfigured] = useState(false);

  // Check if Authentik is configured on backend
  useEffect(() => {
    async function checkAuthentik() {
      try {
        const res = await fetch(`${BACKEND_API}/auth/authentik/config`);
        if (res.ok) {
          const data = await res.json();
          setAuthentikConfigured(data.configured);
        }
      } catch (err) {
        // Backend offline or error
      }
    }
    checkAuthentik();
  }, []);

  // Handle URL redirect query params (e.g. return from Authentik callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const authError = params.get('auth_error');

    if (urlToken) {
      localStorage.setItem('movie_match_jwt_token', urlToken);
      setSuccess('Authenticated via Authentik SSO!');
      // Clear token from URL bar
      window.history.pushState({}, '', window.location.pathname);
      setTimeout(() => window.location.reload(), 800);
    } else if (authError) {
      setError(`Authentik SSO Error: ${authError}`);
      window.history.pushState({}, '', window.location.pathname);
    }
  }, []);

  if (!isOpen) return null;

  // Email Validation helper
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isEmailValid = mode === 'login' || (email && EMAIL_REGEX.test(email.trim()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup' && !isEmailValid) {
      setError('Please enter a valid email address (e.g. user@domain.com).');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(username, password);
        setSuccess('Successfully authenticated!');
      } else {
        await register(username, email, password);
        setSuccess('Account created & authenticated!');
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthentikLogin = () => {
    window.location.href = `${BACKEND_API}/auth/authentik/login`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-7 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-md">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {isAuthenticated ? 'Account Profile' : mode === 'login' ? 'Sign In to Movie Match' : 'Create Account'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {isAuthenticated ? 'Manage active session and tokens' : 'Sync watchlists & share matches across devices'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Authenticated State Profile View */}
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3.5 shadow-inner">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg border border-indigo-400/40">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{user.username}</h4>
                  <p className="text-xs text-slate-400 font-semibold">{user.email}</p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> JWT Token Verified & Active
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-3.5 rounded-2xl bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/60 transition-all font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          ) : (
            <>
              {/* Authentik SSO Button */}
              <button
                onClick={handleAuthentikLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-200 font-extrabold text-xs shadow-lg hover:border-slate-700 transition-all flex items-center justify-between border border-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" />
                  <span>Authenticate with Authentik SSO</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  or email login
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Login / Signup Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              {/* Alerts */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 font-semibold shadow-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 font-semibold shadow-md">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                    {mode === 'login' ? 'Username or Email' : 'Username'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. cinemafan"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                        Email Address
                      </label>
                      {email && (
                        <span className={`text-[10px] font-extrabold flex items-center gap-1 ${isEmailValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isEmailValid ? <CheckCircle2 className="w-3 h-3" /> : 'Invalid email'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-slate-950 border text-slate-100 text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition-all font-semibold ${
                          email && !isEmailValid
                            ? 'border-rose-500/80 focus:border-rose-500'
                            : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || (mode === 'signup' && !isEmailValid)}
                  className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 text-white font-extrabold text-xs shadow-xl shadow-indigo-950/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 border border-indigo-400/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Account</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Verified Account</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
