import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, BlockId, CanvasItem, Thread, CanvasBlock as ICanvasBlock, User } from './types';
import { INITIAL_BLOCKS } from './constants';
import { CanvasBlock } from './components/CanvasBlock';
import { DiscoveryCanvasWizard } from './components/DiscoveryCanvasWizard';
import { ProjectBackpack } from './components/ProjectBackpack';
import { LogicThreads } from './components/LogicThreads';
import { LandingPage } from './components/LandingPage';
import { runOrphanCheck, generateAbstract, generateGrantOutline, processDocumentImport, fixLogicalGap, refineCanvas } from './services/geminiService';
import { storageService } from './services/storageService';
// @ignore
// @ts-ignore
import pptxgen from 'pptxgenjs';

const App: React.FC = () => {
  // Authentication State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('compass_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Project State
  const [project, setProject] = useState<ProjectState>(() => {
    const backpack = storageService.getBackpack();
    if (backpack.length > 0) {
      return backpack.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    }
    return storageService.createNewProject("My Compass", INITIAL_BLOCKS);
  });

  const [showWizard, setShowWizard] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [showDraftMenu, setShowDraftMenu] = useState(false);
  const [showThreads, setShowThreads] = useState(true);
  const [linkingState, setLinkingState] = useState<{ active: boolean; sourceId: string | null }>({ active: false, sourceId: null });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [fixingWarning, setFixingWarning] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<{ type: string; text: string } | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [importStage, setImportStage] = useState<{current: number, total: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftMenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-save project
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => storageService.saveProject(project), 1000);
      return () => clearTimeout(timer);
    }
  }, [project, user]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('compass_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    if (window.confirm("Log out of research suite?")) {
      setUser(null);
      localStorage.removeItem('compass_user');
    }
  };

  const handleReset = () => {
    if (window.confirm("Clear all compass contents?")) {
      // Force a deep copy of the initial state to ensure a completely clean slate
      // We do not use the previous state's block structure to avoid carrying over corrupt data
      const freshBlocks = JSON.parse(JSON.stringify(INITIAL_BLOCKS));
      
      setProject(prev => ({
        ...prev,
        blocks: freshBlocks,
        threads: [],
        updatedAt: Date.now()
      }));
    }
  };

  const handleAddItem = (blockId: string, text: string) => {
    const newItem: CanvasItem = { id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, text };
    setProject(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: { ...prev.blocks[blockId as BlockId], items: [...prev.blocks[blockId as BlockId].items, newItem] }
      }
    }));
  };

  const handleUpdateItem = (blockId: string, itemId: string, updates: Partial<CanvasItem>) => {
    setProject(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: {
          ...prev.blocks[blockId as BlockId],
          items: prev.blocks[blockId as BlockId].items.map(i => i.id === itemId ? { ...i, ...updates } : i)
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

  const startLinking = (itemId: string) => setLinkingState({ active: true, sourceId: itemId });
  const endLinking = (targetId: string) => {
    if (linkingState.sourceId && linkingState.sourceId !== targetId) {
      const threadExists = project.threads.some(t => 
        (t.sourceId === linkingState.sourceId && t.targetId === targetId) ||
        (t.sourceId === targetId && t.targetId === linkingState.sourceId)
      );
      if (!threadExists) {
        const newThread: Thread = { id: `th-${Date.now()}`, sourceId: linkingState.sourceId, targetId };
        setProject(prev => ({ ...prev, threads: [...prev.threads, newThread] }));
      }
    }
    setLinkingState({ active: false, sourceId: null });
  };

  const runLogicCheck = async () => {
    setIsChecking(true);
    setProcessingStatus("Auditing research architecture...");
    try {
      const results = await runOrphanCheck(project.blocks);
      setWarnings(results);
      setProcessingStatus(results.length === 0 ? "Project is sound." : `${results.length} gaps identified.`);
      setTimeout(() => setProcessingStatus(""), 3000);
    } catch (e) { setProcessingStatus("Audit failed."); } finally { setIsChecking(false); }
  };

  const handleRefine = async () => {
    setIsRefining(true);
    setProcessingStatus("Enhancing wording & consolidating nodes...");
    try {
      const refinedData = await refineCanvas(project.blocks);
      setProject(prev => {
        const newBlocks = { ...prev.blocks };
        Object.entries(refinedData).forEach(([key, strings]) => {
          if (newBlocks[key as BlockId] && Array.isArray(strings)) {
            newBlocks[key as BlockId].items = strings.map((text: any, idx: number) => ({
              id: `refined-${key}-${idx}-${Date.now()}`, text: text as string,
            }));
          }
        });
        return { ...prev, blocks: newBlocks, updatedAt: Date.now() };
      });
      setProcessingStatus("Canvas refined.");
      setTimeout(() => setProcessingStatus(""), 3000);
    } catch (err) {
      setProcessingStatus("Refinement failed.");
      setTimeout(() => setProcessingStatus(""), 4000);
    } finally {
      setIsRefining(false);
    }
  };

  const handleFixGap = async (warning: string) => {
    setFixingWarning(warning);
    setProcessingStatus("AI is generating missing components...");
    try {
      const fixedData = await fixLogicalGap(project.blocks, warning);
      setProject(prev => {
        const newBlocks = { ...prev.blocks };
        Object.entries(fixedData).forEach(([key, strings]) => {
          if (newBlocks[key as BlockId] && Array.isArray(strings)) {
            newBlocks[key as BlockId].items = strings.map((text: any, idx: number) => ({
              id: `fixed-${key}-${idx}-${Date.now()}`, text: text as string,
            }));
          }
        });
        return { ...prev, blocks: newBlocks };
      });
      setWarnings(prev => prev.filter(w => w !== warning));
    } catch (err) { alert("AI resolution failed."); } finally { setFixingWarning(null); setProcessingStatus(""); }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStage({ current: 1, total: 4 });
    setProcessingStatus("Streaming PDF data...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        const result = await processDocumentImport(base64, file.type, (status) => {
          setProcessingStatus(status);
          setImportStage(prev => prev ? { ...prev, current: prev.current + 1 } : null);
        });

        setProject(prev => {
          const newBlocks = { ...prev.blocks };
          Object.entries(result).forEach(([key, val]) => {
            if (newBlocks[key as BlockId] && Array.isArray(val)) {
              const newItems = val.map((txt, idx) => ({
                id: `import-${key}-${idx}-${Date.now()}`,
                text: txt as string
              }));
              newBlocks[key as BlockId].items = [...newItems];
            }
          });
          return { ...prev, blocks: newBlocks, name: file.name.split('.')[0], updatedAt: Date.now() };
        });

        setProcessingStatus("Architecture Complete.");
        setImportStage(null);
        setTimeout(() => setProcessingStatus(""), 3000);
      } catch (err) {
        setProcessingStatus("Extraction interrupted.");
        setImportStage(null);
        setTimeout(() => setProcessingStatus(""), 4000);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportPPT = () => {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    // Slide 1: Title
    const titleSlide = pres.addSlide();
    titleSlide.background = { color: 'F1F5F9' };
    titleSlide.addText(project.name, {
      x: 1, y: 1.5, w: '80%', h: 1,
      fontSize: 36, bold: true, color: '1E293B', align: 'center'
    });
    titleSlide.addText('RESEARCH PROJECT COMPASS', {
      x: 1, y: 2.5, w: '80%', h: 0.5,
      fontSize: 14, color: '64748B', align: 'center', bold: true
    });

    // Slide 2: FULL COMPASS OVERVIEW (High Density)
    const summarySlide = pres.addSlide();
    summarySlide.addText("FULL PROJECT COMPASS", { x: 0.4, y: 0.2, w: '90%', h: 0.4, fontSize: 18, bold: true, color: '4F46E5' });
    
    const blockIds = Object.keys(project.blocks) as BlockId[];
    const cols = 5;
    const boxW = 1.8;
    const boxH = 1.0;
    const paddingX = 0.15;
    const paddingY = 0.15;

    blockIds.forEach((bid, idx) => {
      const colIdx = idx % cols;
      const rowIdx = Math.floor(idx / cols);
      const x = 0.4 + colIdx * (boxW + paddingX);
      const y = 0.7 + rowIdx * (boxH + paddingY);

      const block = project.blocks[bid];
      summarySlide.addShape(pres.ShapeType.rect, { 
        x, y, w: boxW, h: boxH, 
        fill: { color: 'FFFFFF' }, 
        line: { color: 'E2E8F0', width: 0.5 } 
      });
      summarySlide.addText(block.title, { 
        x: x + 0.05, y: y + 0.05, w: boxW - 0.1, h: 0.15, 
        fontSize: 7, bold: true, color: 'FFFFFF', 
        fill: { color: '4F46E5' },
        align: 'center'
      });
      
      const content = block.items.slice(0, 4).map(i => `• ${i.text}`).join('\n');
      summarySlide.addText(content, { 
        x: x + 0.05, y: y + 0.22, w: boxW - 0.1, h: boxH - 0.3, 
        fontSize: 6, color: '475569', align: 'left', valign: 'top' 
      });
    });

    pres.writeFile({ fileName: `${project.name.replace(/\s+/g, '_')}_Compass.pptx` });
  };

  const renderBlock = (id: BlockId) => {
    // Check if block exists to prevent crash on old data
    if (!project.blocks[id]) return null;
    return (
      <CanvasBlock 
        key={id} block={project.blocks[id]} 
        onAddItem={handleAddItem} onUpdateItemText={(bid, iid, text) => handleUpdateItem(bid, iid, { text })} 
        onDeleteItem={handleDeleteItem} onUpdateItem={handleUpdateItem}
        activeView="Full"
        linkingState={linkingState}
        onStartLink={startLinking}
        onEndLink={endLinking}
      />
    );
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div ref={containerRef} className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900 relative">
      {(isChecking || isRefining || isGeneratingDraft || isImporting) && (
        <div className="fixed top-0 left-0 right-0 h-1.5 z-[250] bg-indigo-100 overflow-hidden">
          <div className="h-full bg-indigo-600 animate-progress-indeterminate w-1/3 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.7)]"></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-white border-b px-6 py-3 grid grid-cols-3 items-center z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowBackpack(true)} className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg shadow-sm transition-colors group flex items-center gap-2 px-3">
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              <span className="text-[10px] font-black uppercase tracking-tight">Vault</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight truncate max-w-[200px]">{project.name}</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Compass</p>
            </div>
          </div>
          <div className="flex justify-center">
            <button onClick={() => setShowWizard(!showWizard)} className={`px-8 py-2.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 ${showWizard ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              {showWizard ? 'HIDE ASSISTANT' : 'GUIDE ME'}
            </button>
          </div>
          <div className="flex justify-end gap-3 items-center">
             <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{user.name}</p>
              <button onClick={handleLogout} className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight">Sign Out</button>
            </div>
            <div className="h-8 w-px bg-slate-100 mx-1" />
            <button onClick={handleReset} className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 border border-rose-100 shadow-sm transition-all">
              RESET
            </button>
            <button onClick={() => setProject(storageService.createNewProject("New Compass", INITIAL_BLOCKS))} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 rounded-lg font-bold text-[11px] border border-indigo-100 shadow-sm transition-all">
              NEW
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 overflow-y-auto bg-slate-200 scrollbar-hide relative z-10">
          {showThreads && <LogicThreads threads={project.threads} containerRef={containerRef} />}
          
          <div className="max-w-[1900px] mx-auto space-y-3 pb-8 relative">
            {warnings.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 shadow-md animate-in slide-in-from-top duration-300 relative z-20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-amber-900 uppercase">Logic Audit Found {warnings.length} Gaps</span>
                  <button onClick={() => setWarnings([])} className="text-amber-500 hover:text-amber-700">✕</button>
                </div>
                <div className="space-y-2">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="bg-white/80 p-2 rounded-lg flex justify-between items-center text-xs text-amber-900">
                      <span>{w}</span>
                      <button onClick={() => handleFixGap(w)} className="bg-amber-600 text-white px-3 py-1 rounded font-bold uppercase text-[9px]">Fix</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TOP ROW: PROBLEM | CLAIM | VALUE */}
            <div className="grid grid-cols-12 gap-3 min-h-[480px]">
              {/* Problem Space - 20% */}
              <div className="col-span-3 border-2 border-indigo-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase text-white tracking-tight">Problem Space</div>
                <div className="flex flex-col gap-2 p-2 flex-1">
                   <div className="flex-[2] flex flex-col">{renderBlock('problem_context')}</div>
                   <div className="flex-1 flex flex-col">{renderBlock('gaps_limits')}</div>
                </div>
              </div>
              
              {/* Claim Space - 50% (3 Columns) */}
              <div className="col-span-6 border-2 border-emerald-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase text-white tracking-tight">Claim Space</div>
                <div className="grid grid-cols-3 gap-2 p-2 flex-1">
                  {renderBlock('questions_hypotheses')}
                  {renderBlock('aims_objectives')}
                  {renderBlock('novelty')}
                </div>
              </div>

              {/* Value Space - 20% */}
              <div className="col-span-3 border-2 border-orange-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-orange-600 px-3 py-1 text-[10px] font-black uppercase text-white tracking-tight">Value Space</div>
                <div className="flex flex-col gap-2 p-2 flex-1">
                  <div className="flex-1 flex flex-col">{renderBlock('stakeholders')}</div>
                  <div className="flex-1 flex flex-col">{renderBlock('impact')}</div>
                </div>
              </div>
            </div>

            {/* MIDDLE ROW: EXECUTION | STRATEGY | VALIDATION */}
            <div className="grid grid-cols-12 gap-3 min-h-[380px]">
              {/* Execution Space - 25% */}
              <div className="col-span-3 border-2 border-violet-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-violet-600 px-3 py-1 text-[10px] font-black uppercase text-white tracking-tight">Execution Space</div>
                <div className="flex flex-col gap-2 p-2 flex-1">
                   <div className="flex-[2] flex flex-col">{renderBlock('methodology')}</div>
                   <div className="flex-1 flex flex-col">{renderBlock('resources')}</div>
                </div>
              </div>

              {/* Strategy & Risk Space - 50% */}
              <div className="col-span-6 border-2 border-amber-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-amber-600 px-3 py-1 text-[10px] font-black uppercase text-white tracking-tight">Strategy & Risk Space</div>
                <div className="grid grid-cols-2 gap-2 p-2 flex-1">
                  {renderBlock('milestones')}
                  {renderBlock('risks')}
                </div>
              </div>

              {/* Validation Space - 25% */}
              <div className="col-span-3 border-2 border-sky-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-sky-600 px-3 py-1 text-[10px] font-black uppercase text-white tracking-tight">Validation Space</div>
                <div className="p-2 flex-1 flex flex-col">{renderBlock('evidence_criteria')}</div>
              </div>
            </div>

            {/* BOTTOM ROW: CONSTRAINTS */}
            <div className="border-2 border-zinc-300 rounded-xl overflow-hidden shadow-sm bg-white flex h-40 shrink-0">
              <div className="bg-zinc-800 text-white flex flex-col items-center justify-center px-2 w-12 shrink-0">
                <span className="font-black uppercase text-[10px] tracking-widest -rotate-90 whitespace-nowrap">Constraints</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-px bg-slate-100">
                {renderBlock('timeline')}{renderBlock('budget')}{renderBlock('ethics')}
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t p-3 flex justify-between items-center shrink-0 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <div className="flex gap-2">
            <button onClick={handleRefine} disabled={isRefining} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-2 transition-all active:scale-95 border border-slate-200">REFINE</button>
            <button onClick={runLogicCheck} disabled={isChecking} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-2 transition-all active:scale-95">LOGIC SCAN</button>
            <button onClick={() => setShowThreads(!showThreads)} className={`px-4 py-1.5 rounded-lg font-bold text-[11px] border transition-all active:scale-95 ${showThreads ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100'}`}>LOGIC FLOW</button>
          </div>
          <div className="flex gap-2 relative" ref={draftMenuRef}>
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".pdf" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isImporting}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-2 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            >
              IMPORT PDF
            </button>
            <button onClick={handleExportPPT} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all active:scale-95">EXPORT PPT</button>
            <button onClick={() => setShowDraftMenu(!showDraftMenu)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-2 transition-all active:scale-95">
              GENERATE DRAFT
            </button>
            {showDraftMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[500] animate-in slide-in-from-bottom-2 duration-300">
                 <button onClick={async () => { setShowDraftMenu(false); setIsGeneratingDraft(true); setProcessingStatus("Writing abstract..."); const text = await generateAbstract(project.blocks, project.name); setDraftContent({ type: "Research Abstract", text }); setIsGeneratingDraft(false); setProcessingStatus(""); }} className="w-full text-left px-6 py-4 text-xs font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-b border-slate-50 tracking-widest uppercase">RESEARCH ABSTRACT</button>
                 <button onClick={async () => { setShowDraftMenu(false); setIsGeneratingDraft(true); setProcessingStatus("Writing outline..."); const text = await generateGrantOutline(project.blocks, project.name); setDraftContent({ type: "Grant Outline", text }); setIsGeneratingDraft(false); setProcessingStatus(""); }} className="w-full text-left px-6 py-4 text-xs font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 tracking-widest uppercase">GRANT OUTLINE</button>
              </div>
            )}
          </div>
        </footer>
      </div>

      {(processingStatus || isRefining) && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/90 backdrop-blur-md text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-4">
          <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" className="opacity-75"></path></svg>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-wider">{processingStatus}</span>
          </div>
        </div>
      )}

      {showBackpack && (
        <div className="fixed inset-0 z-[300] flex animate-in fade-in duration-300">
          <div className="w-80 h-full shadow-2xl"><ProjectBackpack onSelect={(p) => { setProject(p); setShowBackpack(false); }} currentProjectId={project.id} onClose={() => setShowBackpack(false)} /></div>
          <div className="flex-1 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowBackpack(false)} />
        </div>
      )}

      {showWizard && (
        <aside className="w-[480px] border-l bg-white shadow-2xl shrink-0 flex flex-col z-50 animate-in slide-in-from-right duration-300"><DiscoveryCanvasWizard onUpdateCanvas={(updates) => {
          setProject(prev => {
            const newBlocks = { ...prev.blocks };
            Object.entries(updates).forEach(([key, val]) => { if (newBlocks[key as BlockId] && val) { newBlocks[key as BlockId].items.push({ id: `wiz-${Date.now()}-${Math.random()}`, text: val as string }); } });
            return { ...prev, blocks: newBlocks };
          });
        }} onClose={() => setShowWizard(false)} /></aside>
      )}

      {draftContent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[400] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{draftContent.type}</h2>
              <button onClick={() => setDraftContent(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-white whitespace-pre-wrap text-slate-700 font-serif leading-loose text-lg tracking-tight selection:bg-indigo-100">{draftContent.text}</div>
            <div className="p-8 border-t bg-slate-50 flex justify-end gap-3 shadow-inner">
              <button onClick={() => { navigator.clipboard.writeText(draftContent.text); alert("Draft copied."); }} className="px-8 py-3.5 bg-indigo-600 text-white text-sm font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">COPY TEXT</button>
              <button onClick={() => setDraftContent(null)} className="px-8 py-3.5 bg-white border border-slate-200 text-slate-700 text-sm font-black rounded-2xl hover:bg-slate-100 transition-colors">CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;