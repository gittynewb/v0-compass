
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  // Add JSON-LD for AI Search & SEO Ranking
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Research Project Compass",
      "operatingSystem": "Web",
      "applicationCategory": "ResearchApplication",
      "description": "An intelligent research architecture tool helping scientists map hypotheses to scientific pipelines using the Heilmeier Catechism.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Heilmeier Catechism Framework",
        "AI-Powered Research Abstract Generation",
        "Grant Proposal Outlining",
        "PDF Research Import",
        "Scientific Logic Auditing"
      ]
    };
    script.innerHTML = JSON.stringify(structuredData);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGuestLogin = () => {
    onLogin({
      id: 'guest-' + Date.now(),
      email: 'guest@research.compass',
      name: 'Guest Researcher'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full z-50">
        <div className="flex items-center gap-3 group cursor-pointer" role="banner">
          <div className="w-12 h-12 bg-[#5252ff] rounded-2xl flex items-center justify-center shadow-indigo-200 shadow-xl group-hover:rotate-6 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
              <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
              <path d="M15.73 9.73A2.5 2.5 0 1 1 18 14H2" />
            </svg>
          </div>
          <h1 className="font-black text-3xl tracking-tighter text-[#1a1c24] uppercase">Compass</h1>
        </div>
        <div className="flex gap-8 items-center">
          <button 
            onClick={handleGuestLogin}
            className="bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            Try it now!
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden pt-12">
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
              onClick={handleGuestLogin}
              className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] text-xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-3 active:scale-95 group"
            >
              Start New Project
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="mt-40 w-full max-w-7xl mx-auto text-left" aria-labelledby="how-it-works-heading">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 px-4">
            <div className="max-w-xl">
              <h2 id="how-it-works-heading" className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Engineered for <span className="text-indigo-600">Precision.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium mt-4">
                A streamlined workflow to move from initial hunch to peer-reviewed impact.
              </p>
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
        </section>

        {/* Feature Highlight Grid */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full pb-32 px-4" aria-label="Key Features">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-left group hover:shadow-2xl transition-all">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight text-balance">Rigorous Methodology</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Built on the foundation of the Heilmeier Catechism used by DARPA and top-tier research institutions.</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-left group hover:shadow-2xl transition-all">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight text-balance">Active Kill-Switches</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Identify critical assumptions early. Manage fatal flaws before they consume years of research funding.</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-left group hover:shadow-2xl transition-all">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-8 group-hover:scale-110 group-hover:bg-rose-100 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight text-balance">Visual Logic Mapping</h3>
            <p className="text-slate-500 font-medium leading-relaxed">See the threads that connect your data to your claims. Map out multi-disciplinary research flows visually.</p>
          </div>
        </section>
      </main>

      <footer className="py-16 px-6 border-t border-slate-100 bg-white" role="contentinfo">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale opacity-40">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
                <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
                <path d="M15.73 9.73A2.5 2.5 0 1 1 18 14H2" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tighter text-slate-900 uppercase">Research Project Compass © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
