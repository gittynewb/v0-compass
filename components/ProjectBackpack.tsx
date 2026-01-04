
import React from 'react';
import { ProjectState, CanvasBlock } from '../types';
import { storageService } from '../services/storageService';

interface BackpackProps {
  onSelect: (project: ProjectState) => void;
  currentProjectId: string;
  onClose: () => void;
}

export const ProjectBackpack: React.FC<BackpackProps> = ({ onSelect, currentProjectId, onClose }) => {
  const [projects, setProjects] = React.useState<ProjectState[]>([]);

  React.useEffect(() => {
    setProjects(storageService.getBackpack().sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this compass forever?')) {
      storageService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Project Vault</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1">Saved Compasses</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {projects.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm">Your backpack is empty.</p>
          </div>
        )}
        {projects.map(p => (
          <div 
            key={p.id}
            onClick={() => onSelect(p)}
            className={`group p-4 rounded-xl border cursor-pointer transition-all ${
              p.id === currentProjectId 
                ? 'bg-indigo-600 border-indigo-400 shadow-lg scale-[1.02]' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold text-sm truncate">{p.name}</h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Last updated: {new Date(p.updatedAt).toLocaleDateString()} at {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button 
                onClick={(e) => handleDelete(e, p.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-400 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
            <div className="mt-3 flex gap-1">
              {/* Fix: Cast Object.values to CanvasBlock[] to resolve type error where 'b' is inferred as 'unknown' */}
              {(Object.values(p.blocks) as CanvasBlock[]).slice(0, 5).map((b, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${b.items.length > 0 ? 'bg-indigo-400' : 'bg-slate-600 opacity-30'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
