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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
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
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md bg-[#FBF9F5] border border-stone-300/80 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-7 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-stone-200/60 text-stone-800 border border-stone-300/60 shadow-sm">
                <User className="w-5 h-5 text-stone-800" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-normal text-stone-900">
                  {isAuthenticated ? 'Account Profile' : mode === 'login' ? 'Sign In to Movie Match' : 'Create Account'}
                </h3>
                <p className="text-xs font-sans font-light text-stone-500">
                  {isAuthenticated ? 'Manage active session and tokens' : 'Sync watchlists & share matches across devices'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-200/50 text-stone-600 hover:text-stone-900 border border-stone-300/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Authenticated State Profile View */}
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-stone-300/80 flex items-center gap-3.5 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center font-serif text-stone-100 text-lg shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-serif font-normal text-stone-900">{user.username}</h4>
                  <p className="text-xs font-sans font-light text-stone-500">{user.email}</p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-medium text-emerald-800 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Session Active
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-3.5 rounded-2xl bg-stone-200 text-stone-800 hover:bg-stone-300 border border-stone-300/80 transition-all font-sans font-medium text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          ) : (
            <>
              {/* Authentik SSO Button (Only visible if Authentik server is configured) */}
              {authentikConfigured && (
                <>
                  <button
                    onClick={handleAuthentikLogin}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#FFFDF9] hover:bg-stone-100 text-stone-800 font-sans font-medium text-xs shadow-sm hover:border-stone-300 transition-all flex items-center justify-between border border-stone-300/80 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-stone-700" />
                      <span>Authenticate with Authentik SSO</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-stone-200"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-sans font-medium uppercase tracking-wider text-stone-400">
                      Or Email Login
                    </span>
                    <div className="flex-grow border-t border-stone-200"></div>
                  </div>
                </>
              )}

              {/* Login / Signup Tabs */}
              <div className="flex bg-stone-200/50 p-1 rounded-2xl border border-stone-300/40">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-sans font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900'
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
                  className={`flex-1 py-2 rounded-xl text-xs font-sans font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              {/* Alerts */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-sans font-normal shadow-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-sans font-normal shadow-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-sans font-medium text-stone-600 uppercase tracking-wider block">
                    {mode === 'login' ? 'Username or Email' : 'Username'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. cinemafan"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#FFFDF9] border border-stone-300/80 text-stone-900 text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-stone-500 transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-sans font-medium text-stone-600 uppercase tracking-wider block">
                        Email Address
                      </label>
                      {email && (
                        <span className={`text-[10px] font-sans font-medium flex items-center gap-1 ${isEmailValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isEmailValid ? <CheckCircle2 className="w-3 h-3" /> : 'Invalid email'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-[#FFFDF9] border text-stone-900 text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition-all font-sans font-medium ${
                          email && !isEmailValid
                            ? 'border-rose-400 focus:border-rose-500'
                            : 'border-stone-300/80 focus:border-stone-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-sans font-medium text-stone-600 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#FFFDF9] border border-stone-300/80 text-stone-900 text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-stone-500 transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || (mode === 'signup' && !isEmailValid)}
                  className="w-full py-3.5 mt-2 rounded-2xl bg-stone-900 text-stone-100 font-sans font-medium text-xs shadow-sm hover:bg-stone-800 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-100" />
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Account</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
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
