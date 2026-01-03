
import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, BlockId, CanvasItem, Thread, CanvasBlock as ICanvasBlock, SpaceId } from './types';
import { INITIAL_BLOCKS } from './constants';
import { CanvasBlock } from './components/CanvasBlock';
import { DiscoveryCanvasWizard } from './components/DiscoveryCanvasWizard';
import { ProjectBackpack } from './components/ProjectBackpack';
import { runOrphanCheck, generateGrantDraft, refineCanvas, processDocumentImport, fixLogicalGap } from './services/geminiService';
import { storageService } from './services/storageService';
// @ignore
// @ts-ignore
import pptxgen from 'pptxgenjs';

const App: React.FC = () => {
  // Initialize from storage or create new
  const [project, setProject] = useState<ProjectState>(() => {
    const backpack = storageService.getBackpack();
    if (backpack.length > 0) {
      return backpack.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    }
    return storageService.createNewProject("My Compass", INITIAL_BLOCKS);
  });

  const [showWizard, setShowWizard] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [fixingWarning, setFixingWarning] = useState<string | null>(null);
  const [lastBlocksState, setLastBlocksState] = useState<Record<BlockId, ICanvasBlock> | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [grantDraft, setGrantDraft] = useState<string | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      storageService.saveProject(project);
    }, 1000);
    return () => clearTimeout(timer);
  }, [project]);

  const handleNewProject = () => {
    const name = prompt("Enter a name for your new Research Compass:", `Compass ${new Date().toLocaleDateString()}`);
    if (name) {
      const newProj = storageService.createNewProject(name, INITIAL_BLOCKS);
      setProject(newProj);
      storageService.saveProject(newProj);
    }
  };

  const handleSelectProject = (p: ProjectState) => {
    setProject(p);
    setShowBackpack(false);
  };

  const handleAddItem = (blockId: string, text: string) => {
    const newItem: CanvasItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
    };
    setProject(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: {
          ...prev.blocks[blockId as BlockId],
          items: [...prev.blocks[blockId as BlockId].items, newItem]
        }
      }
    }));
  };

  const handleUpdateItemText = (blockId: string, itemId: string, newText: string) => {
    setProject(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: {
          ...prev.blocks[blockId as BlockId],
          items: prev.blocks[blockId as BlockId].items.map(i => i.id === itemId ? { ...i, text: newText } : i)
        }
      }
    }));
  };

  const handleDeleteItem = (blockId: string, itemId: string) => {
    setProject(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: {
          ...prev.blocks[blockId as BlockId],
          items: prev.blocks[blockId as BlockId].items.filter(i => i.id !== itemId)
        }
      },
      threads: prev.threads.filter(t => t.sourceId !== itemId && t.targetId !== itemId)
    }));
  };

  const handleUpdateCanvasFromWizard = (updates: Record<string, string>) => {
    setProject(prev => {
      const newBlocks = { ...prev.blocks };
      Object.entries(updates).forEach(([key, val]) => {
        if (newBlocks[key as BlockId] && val) {
          const newItem: CanvasItem = {
            id: `wizard-${Date.now()}-${Math.random()}`,
            text: val,
          };
          newBlocks[key as BlockId].items.push(newItem);
        }
      });
      return { ...prev, blocks: newBlocks };
    });
  };

  const runLogicCheck = async () => {
    setIsChecking(true);
    try {
      const results = await runOrphanCheck(project.blocks);
      setWarnings(results);
    } catch (e) { console.error(e); } finally { setIsChecking(false); }
  };

  const handleFixGap = async (warning: string) => {
    setFixingWarning(warning);
    try {
      const fixedData = await fixLogicalGap(project.blocks, warning);
      setProject(prev => {
        const newBlocks = { ...prev.blocks };
        Object.entries(fixedData).forEach(([key, strings]) => {
          if (newBlocks[key as BlockId] && Array.isArray(strings)) {
            newBlocks[key as BlockId].items = strings.map((text: any, idx: number) => ({
              id: `fixed-${key}-${idx}-${Date.now()}`,
              text: text as string,
            }));
          }
        });
        return { ...prev, blocks: newBlocks };
      });
      setWarnings(prev => prev.filter(w => w !== warning));
    } catch (err) {
      alert("AI was unable to resolve this gap.");
    } finally {
      setFixingWarning(null);
    }
  };

  const handleRefineCanvas = async () => {
    setIsRefining(true);
    setLastBlocksState(JSON.parse(JSON.stringify(project.blocks)));
    try {
      const refinedData = await refineCanvas(project.blocks);
      setProject(prev => {
        const newBlocks = { ...prev.blocks };
        Object.entries(refinedData).forEach(([key, strings]) => {
          if (newBlocks[key as BlockId] && Array.isArray(strings)) {
            newBlocks[key as BlockId].items = strings.map((text: any, idx: number) => ({
              id: `refined-${key}-${idx}-${Date.now()}`,
              text: text as string,
            }));
          }
        });
        return { ...prev, blocks: newBlocks };
      });
    } catch (e) { alert("Refinement failed."); } finally { setIsRefining(false); }
  };

  const handleRevertRefinement = () => {
    if (lastBlocksState) {
      setProject(prev => ({ ...prev, blocks: lastBlocksState }));
      setLastBlocksState(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      try {
        const extractedData = await processDocumentImport(result, file.type);
        setProject(prev => {
          const newBlocks = { ...prev.blocks };
          Object.entries(extractedData).forEach(([key, strings]) => {
            if (newBlocks[key as BlockId] && Array.isArray(strings) && strings.length > 0) {
              const newItems = strings.map((t, idx) => ({ 
                id: `import-${key}-${idx}-${Date.now()}`, 
                text: t as string 
              }));
              newBlocks[key as BlockId].items = [...newBlocks[key as BlockId].items, ...newItems];
            }
          });
          return { ...prev, blocks: newBlocks };
        });
      } catch (err) { alert("Parsing failed."); } finally { setIsImporting(false); }
    };

    if (['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleExportPPT = () => {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    let slide = pptx.addSlide();
    slide.background = { color: 'F1F5F9' };
    slide.addText(project.name, { x: 1, y: 1.5, w: '80%', fontSize: 44, bold: true, color: '1E293B', align: 'center' });
    pptx.writeFile({ fileName: `${project.name.replace(/\s+/g, '_')}_Research_Compass.pptx` });
  };

  const renderBlock = (id: BlockId) => (
    <CanvasBlock 
      key={id} block={project.blocks[id]} 
      onAddItem={handleAddItem} onUpdateItemText={handleUpdateItemText} 
      onDeleteItem={handleDeleteItem} activeView="Full"
      linkingState={{ active: false, sourceId: null }} onStartLink={() => {}} onEndLink={() => {}}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900 relative">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-3 grid grid-cols-3 items-center z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowBackpack(!showBackpack)}
              className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg shadow-sm transition-colors group flex items-center gap-2 px-3"
            >
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              <span className="text-[10px] font-black uppercase tracking-tight">Vault</span>
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight truncate max-w-[200px]">{project.name}</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Research Project Compass</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={() => setShowWizard(!showWizard)} 
              className={`px-8 py-2.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 ${
                showWizard ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              {showWizard ? 'HIDE ASSISTANT' : 'GUIDE ME'}
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={handleNewProject}
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 border border-indigo-100 shadow-sm transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              NEW COMPASS
            </button>
          </div>
        </header>

        <main key={project.id} className="flex-1 p-3 overflow-y-auto bg-slate-200 scrollbar-hide">
          <div className="max-w-[1800px] mx-auto space-y-3 pb-8">
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2 border-2 border-indigo-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-indigo-600 px-3 py-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase text-white tracking-tight">Problem Space</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 flex-1 min-h-[300px]">
                   <div className="flex flex-col gap-2 h-full">
                    <div className="flex-1 min-h-0">{renderBlock('problem_context')}</div>
                    <div className="flex-1 min-h-0">{renderBlock('prior_work')}</div>
                  </div>
                  <div className="flex flex-col gap-2 h-full">
                    <div className="flex-1 min-h-0">{renderBlock('gaps_limits')}</div>
                    <div className="flex-1 min-h-0">{renderBlock('current_solutions')}</div>
                  </div>
                </div>
              </div>
              <div className="col-span-3 border-2 border-emerald-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-emerald-600 px-3 py-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase text-white tracking-tight">Claim Space</span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2 flex-1 min-h-[300px]">
                  {renderBlock('questions_hypotheses')}
                  {renderBlock('novelty')}
                  {renderBlock('contribution')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-1 border-2 border-emerald-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-emerald-50/20">
                <div className="bg-emerald-600 px-3 py-1 flex items-center justify-between shrink-0"><span className="text-[10px] font-black uppercase text-white tracking-tight">Focus</span></div>
                <div className="p-2 flex-1 min-h-[260px]">{renderBlock('aims_objectives')}</div>
              </div>
              <div className="col-span-2 border-2 border-orange-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-orange-600 px-3 py-1 flex items-center justify-between shrink-0"><span className="text-[10px] font-black uppercase text-white tracking-tight">Value Space</span></div>
                <div className="grid grid-cols-2 gap-2 p-2 flex-1 min-h-[260px]">{renderBlock('stakeholders')}{renderBlock('impact')}</div>
              </div>
              <div className="col-span-3 border-2 border-violet-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-violet-600 px-3 py-1 flex items-center justify-between shrink-0"><span className="text-[10px] font-black uppercase text-white tracking-tight">Execution Space</span></div>
                <div className="grid grid-cols-3 gap-2 p-2 flex-1 min-h-[260px]">{renderBlock('methodology')}{renderBlock('data')}{renderBlock('resources')}</div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-1 border-2 border-sky-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-sky-600 px-3 py-1 flex items-center justify-between shrink-0"><span className="text-[10px] font-black uppercase text-white tracking-tight">Validation</span></div>
                <div className="p-2 flex-1 min-h-[240px]">{renderBlock('evidence_criteria')}</div>
              </div>
              <div className="col-span-5 border-2 border-amber-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-amber-600 px-3 py-1 flex items-center justify-between shrink-0"><span className="text-[10px] font-black uppercase text-white tracking-tight">Risk & Strategy Space</span></div>
                <div className="grid grid-cols-4 gap-2 p-2 flex-1 min-h-[240px]">{renderBlock('milestones')}{renderBlock('decision_points')}{renderBlock('risks')}{renderBlock('contingencies')}</div>
              </div>
            </div>

            <div className="border-2 border-zinc-300 rounded-xl overflow-hidden shadow-sm bg-white flex h-48 shrink-0">
              <div className="bg-zinc-800 text-white flex flex-col items-center justify-center px-2 w-12 shrink-0">
                <span className="font-black uppercase text-[10px] tracking-widest -rotate-90 whitespace-nowrap">Constraints</span>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-px bg-slate-100">
                <div className="bg-white min-h-0 overflow-hidden">{renderBlock('timeline')}</div>
                <div className="bg-white min-h-0 overflow-hidden">{renderBlock('budget')}</div>
                <div className="bg-white min-h-0 overflow-hidden">{renderBlock('ethics')}</div>
                <div className="bg-white min-h-0 overflow-hidden">{renderBlock('access')}</div>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t p-3 flex justify-between items-center shrink-0 z-40">
          <div className="flex gap-2">
            <button onClick={handleRefineCanvas} disabled={isRefining} className={`px-4 py-1.5 rounded-lg font-bold text-[11px] border transition-colors ${isRefining ? 'bg-slate-50 text-slate-300' : 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm'}`}>{isRefining ? 'REFINING...' : 'AI REFINE'}</button>
            <button onClick={runLogicCheck} disabled={isChecking} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm">{isChecking ? 'SCANNING...' : 'LOGIC CHECK'}</button>
          </div>
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf,.doc,.docx" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-50 border border-slate-200 hover:bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm">IMPORT</button>
            <button onClick={handleExportPPT} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1.5">EXPORT PPT</button>
            <button onClick={() => {}} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all">GENERATE DRAFT</button>
          </div>
        </footer>
      </div>

      {showBackpack && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
          <div className="w-80 h-full shadow-2xl animate-in slide-in-from-left duration-500">
            <ProjectBackpack onSelect={handleSelectProject} currentProjectId={project.id} onClose={() => setShowBackpack(false)} />
          </div>
          <div className="flex-1 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowBackpack(false)} />
        </div>
      )}

      {showWizard && (
        <aside className="w-[480px] border-l bg-white shadow-2xl shrink-0 flex flex-col z-50 animate-in slide-in-from-right duration-300">
          <DiscoveryCanvasWizard onUpdateCanvas={handleUpdateCanvasFromWizard} onClose={() => setShowWizard(false)} />
        </aside>
      )}
    </div>
  );
};

export default App;
