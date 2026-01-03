import React, { useState } from 'react';
import { WIZARD_QUESTIONS } from '../constants';
import { processWizardInput } from '../services/geminiService';
import { BlockId } from '../types';

interface WizardProps {
  onUpdateCanvas: (updates: Record<string, string>) => void;
  onClose: () => void;
}

export const DiscoveryCanvasWizard: React.FC<WizardProps> = ({ onUpdateCanvas, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{q: string, a: string}[]>([]);

  const question = WIZARD_QUESTIONS[currentStep];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsLoading(true);
    try {
      const updates = await processWizardInput(question.question, answer);
      onUpdateCanvas(updates);
      setChatHistory([...chatHistory, { q: question.question, a: answer }]);
      setAnswer('');
      
      if (currentStep < WIZARD_QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Automatically close on finish
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentStep < WIZARD_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setAnswer('');
    } else {
      onClose();
    }
  };

  const jumpToStep = (index: number) => {
    setCurrentStep(index);
    setAnswer('');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Wizard Header */}
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            {currentStep + 1}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-none">Guide Me</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Research Intelligence Engine</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Step Sidebar Navigation */}
        <nav className="w-16 border-r bg-slate-50 flex flex-col items-center py-4 gap-2 overflow-y-auto shrink-0">
          {WIZARD_QUESTIONS.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => jumpToStep(idx)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all border-2 ${
                currentStep === idx 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-110' 
                  : idx < currentStep 
                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-400'
              }`}
              title={q.question}
            >
              {idx + 1}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Current Discovery Task</p>
                <h3 className="text-lg font-bold text-slate-800 leading-snug">
                  {question.question}
                </h3>
                <p className="text-xs text-slate-500 mt-2 italic leading-relaxed">{question.description}</p>
              </div>

              {/* Hints Section */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 11a2 2 0 100-4 2 2 0 000 4z"/></svg>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Helpful Hints</p>
                </div>
                <ul className="space-y-1.5">
                  {question.hints.map((hint, i) => (
                    <li key={i} className="text-[11px] text-amber-800 flex gap-2">
                      <span className="text-amber-400">•</span>
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="text-[10px] text-slate-400 px-1">
                AI will map your answer to the <span className="font-bold text-indigo-400 uppercase">{question.targetBlocks.join(', ')}</span> blocks.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t bg-slate-50">
            <div className="flex flex-col gap-3">
              <textarea
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your insights here..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm h-64 shadow-inner"
                disabled={isLoading}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold transition-all text-sm disabled:opacity-50"
                >
                  {currentStep === WIZARD_QUESTIONS.length - 1 ? 'Finish' : 'Skip'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !answer.trim()}
                  className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 shadow-md text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Extracting...
                    </>
                  ) : (currentStep === WIZARD_QUESTIONS.length - 1 ? 'Finish Discovery' : 'Extract & Next')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};