
import React, { useState, useEffect } from 'react';
import { X, LogIn, Mail, ArrowRight, Loader2, User, Building2, Lock, ChevronLeft, CheckCircle, GraduationCap, AlertTriangle, ShieldAlert, ExternalLink, Settings } from 'lucide-react';
import { COLLEGES } from '../constants';
import { supabase } from '../services/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (uid: string, identifier: string, name: string, collegeId: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'confirmation' | null>(null);

  // Success States
  const [resetSent, setResetSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setCollegeId('');
      setError('');
      setErrorType(null);
      setIsLoading(false);
      setView('login');
      setResetSent(false);
      setVerificationSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType(null);

    if (!email.trim()) return setError('Please enter your email address.');

    if (view === 'forgot') {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setIsLoading(false);
      if (error) setError(error.message);
      else setResetSent(true);
      return;
    }

    if (!password.trim()) return setError('Please enter your password.');
    if (password.length < 6) return setError('Password should be at least 6 characters.');

    if (view === 'signup') {
      if (!name.trim()) return setError('Please enter your full name.');
      if (!collegeId) return setError('Please select your college.');
    }

    setIsLoading(true);

    try {
      if (view === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              college_id: collegeId
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setIsLoading(false);
          setVerificationSent(true);
          return;
        }

        if (data.user) {
          onLogin(data.user.id, email, name, collegeId);
          onClose();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        if (data.user) {
          const userName = data.user.user_metadata.full_name || 'Student';
          const userCollege = data.user.user_metadata.college_id || '';
          onLogin(data.user.id, email, userName, userCollege);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Supabase Auth Error:', err);
      const msg = err.message || "Authentication failed.";

      if (msg.includes("Email not confirmed")) {
        setError("Account verification pending.");
        setErrorType('confirmation');
      } else if (msg.includes("Invalid login credentials")) {
        setError("Wrong email or password. Please try again.");
        setErrorType('auth');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

        {/* Decorative Side Panel */}
        <div className="hidden md:flex w-5/12 relative bg-university-900 flex-col justify-between p-10 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop"
              alt="University Library"
              className="w-full h-full object-cover opacity-20 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-university-900 via-slate-900 to-black opacity-90"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl border border-white/20">
                <GraduationCap className="h-8 w-8 text-university-accent" />
              </div>
              <span className="text-2xl font-serif font-bold text-white tracking-wide">StudyVault</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Knowledge Secured.<br />
              <span className="text-university-accent">Success Assured.</span>
            </h2>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-7/12 p-8 md:p-12 relative bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-full">
            <X className="h-5 w-5" />
          </button>

          <div className="max-w-sm mx-auto h-full flex flex-col justify-center min-h-[450px]">
            <div className="mb-8">
              <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                {view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Reset Password' : 'Welcome Back'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {view === 'signup' ? 'Join StudyVault today.' : 'Enter details to sign in.'}
              </p>
            </div>

            {errorType === 'confirmation' ? (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3 text-amber-900 dark:text-amber-200">
                    <Mail className="h-5 w-5 animate-bounce" />
                    <h4 className="font-black text-xs uppercase tracking-widest">Verify Your Account</h4>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mb-4">
                    We sent a link to <span className="font-bold">{email}</span>. Please click it to login.
                  </p>
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-1 text-amber-900 dark:text-amber-200">
                      <Settings className="h-3 w-3" />
                      <span className="text-[10px] font-black uppercase">Admin Tip (One-time fix)</span>
                    </div>
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 font-medium">
                      To bypass this for all users: Open Supabase {'->'}  Auth {'->'}  Providers {'->'}  Email {'->'}  <strong>Turn OFF "Confirm email"</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setErrorType(null); setView('login'); }}
                  className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest shadow-xl"
                >
                  Try Again
                </button>
              </div>
            ) : verificationSent ? (
              <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verify your email</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Confirmation sent to <span className="font-bold text-gray-800 dark:text-gray-200">{email}</span>.
                </p>
                <button onClick={() => { setVerificationSent(false); setView('login'); }} className="w-full py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-opacity">Back to Login</button>
              </div>
            ) : resetSent ? (
              <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Sent</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Reset link dispatched successfully.</p>
                <button onClick={() => { setResetSent(false); setView('login'); }} className="w-full py-3.5 mt-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-opacity">Return to Login</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {view === 'signup' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-university-accent transition-colors" />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-university-accent focus:ring-1 focus:ring-university-accent dark:text-white transition-all text-sm font-medium" placeholder="Ex: Rahul Kumar" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">College</label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-university-accent transition-colors" />
                        <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="w-full pl-12 p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-university-accent focus:ring-1 focus:ring-university-accent appearance-none dark:text-white transition-all text-sm font-medium">
                          <option value="">Select College</option>
                          {COLLEGES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-university-accent transition-colors" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-university-accent focus:ring-1 focus:ring-university-accent dark:text-white transition-all text-sm font-medium" placeholder="you@ranchiuniversity.ac.in" />
                  </div>
                </div>

                {view !== 'forgot' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-university-accent transition-colors" />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-university-accent focus:ring-1 focus:ring-university-accent dark:text-white transition-all text-sm font-medium" placeholder="••••••••" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-red-600 dark:text-red-400 text-[11px] font-bold p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl bg-university-900 dark:bg-university-accent hover:bg-black dark:hover:bg-amber-600 text-white font-bold shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (view === 'forgot' ? 'Reset Password' : view === 'signup' ? 'Create Account' : 'Log In')}
                </button>
              </form>
            )}

            {!verificationSent && !resetSent && !errorType && (
              <div className="mt-8 text-center text-sm">
                {view === 'login' ? (
                  <>
                    <p className="text-gray-500 dark:text-gray-400">New student? <button onClick={() => setView('signup')} className="font-bold text-university-900 dark:text-white hover:underline">Register Now</button></p>
                    <button onClick={() => setView('forgot')} className="mt-2 text-xs font-bold text-university-accent hover:text-amber-700">Lost password?</button>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Enrolled already? <button onClick={() => setView('login')} className="font-bold text-university-900 dark:text-white hover:underline">Log In</button></p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
