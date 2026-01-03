
import React, { useState } from 'react';
import { WIZARD_QUESTIONS } from '../constants';
import { processWizardInput } from '../services/geminiService';
import { BlockId } from '../types';

interface WizardProps {
  onUpdateCanvas: (updates: Record<string, string>) => void;
  onClose: () => void;
}

export const HeilmeierWizard: React.FC<WizardProps> = ({ onUpdateCanvas, onClose }) => {
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
        // Finished
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l shadow-2xl z-50 flex flex-col">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Heilmeier Wizard</h2>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Guided Research Onboarding</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {chatHistory.map((item, i) => (
          <div key={i} className="space-y-2">
            <div className="bg-slate-100 p-3 rounded-lg text-sm text-slate-600 border border-slate-200">
              <span className="font-bold block mb-1">Q: {item.q}</span>
            </div>
            <div className="bg-blue-600 p-3 rounded-lg text-sm text-white self-end ml-4 shadow-sm">
              {item.a}
            </div>
          </div>
        ))}

        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
          <p className="text-sm font-medium text-blue-900 mb-2">Current Question:</p>
          <h3 className="text-lg font-semibold text-slate-800 leading-tight">
            {question.question}
          </h3>
          <p className="text-xs text-slate-500 mt-2 italic">{question.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 border-t bg-white">
        <div className="flex flex-col gap-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm h-24"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !answer.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 shadow-md"
          >
            {isLoading ? 'Thinking...' : (currentStep === WIZARD_QUESTIONS.length - 1 ? 'Finish' : 'Next Question')}
          </button>
        </div>
        <div className="mt-4 flex gap-1 h-1 bg-slate-100 rounded-full overflow-hidden">
           {WIZARD_QUESTIONS.map((_, idx) => (
             <div key={idx} className={`flex-1 transition-all ${idx <= currentStep ? 'bg-blue-500' : 'bg-slate-200'}`} />
           ))}
        </div>
      </form>
    </div>
  );
};
