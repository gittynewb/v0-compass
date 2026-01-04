
import React, { useState } from 'react';
import { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    // Simulate API call
    setTimeout(() => {
      if (email) {
        onLogin({
          id: 'user-' + Date.now(),
          email: email,
          name: authMode === 'signup' ? name : email.split('@')[0]
        });
      }
      setIsAuthenticating(false);
    }, 800);
  };

  const handleGoogleLogin = () => {
    setIsAuthenticating(true);
    // Simulate Google OAuth flow
    setTimeout(() => {
      onLogin({
        id: 'google-' + Math.random().toString(36).substr(2, 9),
        email: 'researcher@gmail.com',
        name: 'Alex Discovery'
      });
      setIsAuthenticating(false);
    }, 1200);
  };

  const toggleAuthMode = () => {
    setAuthMode(prev => prev === 'signin' ? 'signup' : 'signin');
    setName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-[#5252ff] rounded-2xl flex items-center justify-center shadow-indigo-200 shadow-xl group-hover:rotate-6 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
              <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
              <path d="M15.73 9.73A2.5 2.5 0 1 1 18 14H2" />
            </svg>
          </div>
          <span className="font-black text-3xl tracking-tighter text-[#1a1c24] uppercase">Compass</span>
        </div>
        <div className="flex gap-8 items-center">
          <button 
            onClick={() => { setAuthMode('signin'); setShowAuth(true); }}
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => { setAuthMode('signup'); setShowAuth(true); }}
            className="bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden pt-12">
        {/* Background Decor */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-[120px] -z-10 animate-pulse" />
        
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Empowering the Scientific Method
          </div>
          
<h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.85]">
  Navigate your <br />
  <span className="text-indigo-600">Breakthrough</span>
  <br />with the
  <br /> 
   <span className="text-indigo-600">Research Project Compass.</span>
</h2>
          
          <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            The intelligent research architecture that turns messy hypotheses into structured scientific pipelines. 
          </p>

          <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => { setAuthMode('signup'); setShowAuth(true); }}
              className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] text-xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-3 active:scale-95 group"
            >
              Start New Project
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-40 w-full max-w-7xl mx-auto text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 px-4">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Engineered for <span className="text-indigo-600">Precision.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium mt-4">
                A streamlined workflow to move from initial hunch to peer-reviewed impact.
              </p>
            </div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 border-b-2 border-indigo-100 pb-2">

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
              <div className="text-4xl font-black text-indigo-100 mb-6 group-hover:text-indigo-200 transition-colors">01</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Guide Me</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">
                Answer structured questions in a logical sequence to build your compass. <span className="text-indigo-500 font-bold italic">AI‑assisted (optional)</span>
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
              <div className="text-4xl font-black text-indigo-100 mb-6">02</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Use AI (Optional)</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">
                Use AI to populate, refine, or summarize, or work fully manually.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
              <div className="text-4xl font-black text-indigo-100 mb-6">03</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Logic Check</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">
                Identify inconsistencies and missing links across sections.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
              <div className="text-4xl font-black text-indigo-100 mb-6">04</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Export & Share</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">
                Generate summaries or export slides for collaboration.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlight Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full pb-32 px-4">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-left group hover:shadow-2xl transition-all">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight text-balance">Rigorous Methodology</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Built on the foundation of the Heilmeier Catechism used by DARPA and top-tier research institutions.</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-left group hover:shadow-2xl transition-all">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight text-balance">Active Kill-Switches</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Identify critical assumptions early. Manage fatal flaws before they consume years of research funding.</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-left group hover:shadow-2xl transition-all">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-8 group-hover:scale-110 group-hover:bg-rose-100 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight text-balance">Visual Logic Mapping</h3>
            <p className="text-slate-500 font-medium leading-relaxed">See the threads that connect your data to your claims. Map out multi-disciplinary research flows visually.</p>
          </div>
        </div>
      </main>

      {/* Auth Modal Overlay */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 p-10 flex flex-col items-stretch text-center">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#5252ff] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
                    <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
                    <path d="M15.73 9.73A2.5 2.5 0 1 1 18 14H2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {authMode === 'signin' ? 'Lab Access' : 'Create Account'}
                </h2>
              </div>
              <button 
                onClick={() => setShowAuth(false)} 
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors"
                disabled={isAuthenticating}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Google Sign In Button */}
            <button 
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="group w-full bg-white border-2 border-slate-100 py-4 px-6 rounded-2xl flex items-center justify-center gap-4 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all active:scale-[0.98] mb-8"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-bold text-slate-700">
                {authMode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
              </span>
            </button>

            <div className="relative mb-8 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative bg-white px-4 text-xs font-black text-slate-400 uppercase tracking-widest">or use email</span>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              {authMode === 'signup' && (
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Researcher Name"
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    required
                    disabled={isAuthenticating}
                  />
                </div>
              )}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Identity</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scientist@nexus.edu"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  required
                  disabled={isAuthenticating}
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  {authMode === 'signup' ? 'Password' : 'Secure Passkey'}
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  required
                  disabled={isAuthenticating}
                />
              </div>
              <button 
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm hover:bg-slate-800 shadow-xl shadow-slate-100 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isAuthenticating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (authMode === 'signin' ? 'Enter Workspace' : 'Create Identity')}
              </button>
            </form>
            
            <div className="mt-8">
              <button 
                onClick={toggleAuthMode}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                disabled={isAuthenticating}
              >
                {authMode === 'signin' 
                  ? "Don't have an account? Create one" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="py-16 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale opacity-40">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
                <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
                <path d="M15.73 9.73A2.5 2.5 0 1 1 18 14H2" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tighter text-slate-900 uppercase">Research Project Compass © 2026</span>
          </div>
          <div className="flex gap-12 text-xs font-black text-slate-400 uppercase tracking-widest">

          </div>
        </div>
      </footer>
    </div>
  );
};
