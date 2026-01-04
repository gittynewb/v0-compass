
import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, BlockId, CanvasItem, Thread, CanvasBlock as ICanvasBlock, SpaceId } from './types';
import { INITIAL_BLOCKS } from './constants';
import { CanvasBlock } from './components/CanvasBlock';
import { DiscoveryCanvasWizard } from './components/DiscoveryCanvasWizard';
import { ProjectBackpack } from './components/ProjectBackpack';
import { runOrphanCheck, generateAbstract, generateGrantOutline, refineCanvas, processDocumentImport, fixLogicalGap } from './services/geminiService';
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
  const [showDraftMenu, setShowDraftMenu] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [fixingWarning, setFixingWarning] = useState<string | null>(null);
  const [lastBlocksState, setLastBlocksState] = useState<Record<BlockId, ICanvasBlock> | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [draftContent, setDraftContent] = useState<{ type: string; text: string } | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftMenuRef = useRef<HTMLDivElement>(null);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      storageService.saveProject(project);
    }, 1000);
    return () => clearTimeout(timer);
  }, [project]);

  // Click outside to close draft menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (draftMenuRef.current && !draftMenuRef.current.contains(event.target as Node)) {
        setShowDraftMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNewProject = () => {
    const name = prompt("Enter a name for your new Research Compass:", `Compass ${new Date().toLocaleDateString()}`);
    if (name) {
      const newProj = storageService.createNewProject(name, INITIAL_BLOCKS);
      setProject(newProj);
      storageService.saveProject(newProj);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all contents of this compass? This cannot be undone.")) {
      setProject(prev => {
        const resetBlocks = { ...prev.blocks };
        (Object.keys(resetBlocks) as BlockId[]).forEach(id => {
          resetBlocks[id].items = [];
        });
        return {
          ...prev,
          blocks: resetBlocks,
          threads: [],
          updatedAt: Date.now()
        };
      });
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
    setProcessingStatus("Auditing research architecture for logical gaps...");
    try {
      const results = await runOrphanCheck(project.blocks);
      setWarnings(results);
      if (results.length === 0) {
        setProcessingStatus("No issues found. Project is sound.");
      } else {
        setProcessingStatus(`${results.length} logical gaps identified.`);
      }
      setTimeout(() => setProcessingStatus(""), 3000);
    } catch (e) { 
      console.error(e); 
      setProcessingStatus("Audit failed.");
      setTimeout(() => setProcessingStatus(""), 2000);
    } finally { 
      setIsChecking(false); 
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
      setProcessingStatus("");
    }
  };

  const handleRefineCanvas = async () => {
    setIsRefining(true);
    setProcessingStatus("Synthesizing and clarifying research statements...");
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
    } catch (e) { alert("Refinement failed."); } finally { setIsRefining(false); setProcessingStatus(""); }
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
    setProcessingStatus(`Parsing ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      try {
        setProcessingStatus("Gemini 3 Pro is mapping your document...");
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
      } catch (err) { alert("Parsing failed."); } finally { setIsImporting(false); setProcessingStatus(""); }
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

    const colors = {
      PROBLEM: '4F46E5',
      CLAIM: '059669',
      VALUE: 'EA580C',
      EXECUTION: '7C3AED',
      VALIDATION: '0284C7',
      RISK: 'D97706',
      CONSTRAINTS: '27272A'
    };

    const addBlockToSlide = (slide: any, blockId: BlockId, x: number, y: number, w: number, h: number) => {
      const block = project.blocks[blockId];
      if (!block) return;
      const themeColor = colors[block.category] || '64748B';
      slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 0.5 } });
      slide.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.25, fill: { color: themeColor } });
      slide.addText(block.title.toUpperCase(), { x: x + 0.05, y: y + 0.02, w: w - 0.1, h: 0.2, fontSize: 7, bold: true, color: 'FFFFFF', align: 'left', valign: 'middle' });
      const content = block.items.length > 0 ? block.items.map(i => `• ${i.text}`).join('\n') : 'No entries yet...';
      slide.addText(content, { x: x + 0.05, y: y + 0.3, w: w - 0.1, h: h - 0.35, fontSize: 8, color: '334155', valign: 'top', breakLine: true, shrinkText: true });
    };

    let titleSlide = pptx.addSlide();
    titleSlide.background = { color: 'F1F5F9' };
    titleSlide.addText(project.name, { x: 0, y: 3, w: '100%', fontSize: 44, bold: true, color: '1E293B', align: 'center' });
    titleSlide.addText("RESEARCH PROJECT COMPASS", { x: 0, y: 4, w: '100%', fontSize: 14, color: '64748B', align: 'center', bold: true, charSpacing: 4 });

    let canvasSlide = pptx.addSlide();
    const margin = 0.5;
    const canvasW = 12.33;
    const r1Y = 0.6;
    const r1H = 2.5;
    const colGap = 0.1;

    const probW = (canvasW * 0.4) - colGap;
    const probSubW = (probW - colGap) / 2;
    const probSubH = (r1H - colGap) / 2;
    addBlockToSlide(canvasSlide, 'problem_context', margin, r1Y, probSubW, probSubH);
    addBlockToSlide(canvasSlide, 'prior_work', margin, r1Y + probSubH + colGap, probSubW, probSubH);
    addBlockToSlide(canvasSlide, 'gaps_limits', margin + probSubW + colGap, r1Y, probSubW, probSubH);
    addBlockToSlide(canvasSlide, 'current_solutions', margin + probSubW + colGap, r1Y + probSubH + colGap, probSubW, probSubH);

    const claimW = (canvasW * 0.6);
    const claimSubW = (claimW - (2 * colGap)) / 3;
    addBlockToSlide(canvasSlide, 'questions_hypotheses', margin + probW + colGap, r1Y, claimSubW, r1H);
    addBlockToSlide(canvasSlide, 'novelty', margin + probW + (colGap * 2) + claimSubW, r1Y, claimSubW, r1H);
    addBlockToSlide(canvasSlide, 'contribution', margin + probW + (colGap * 3) + (claimSubW * 2), r1Y, claimSubW, r1H);

    const r2Y = 3.2;
    const r2H = 2.0;
    const fW = canvasW / 6;
    const vW = (canvasW * 2) / 6;
    const eW = (canvasW * 3) / 6;
    addBlockToSlide(canvasSlide, 'aims_objectives', margin, r2Y, fW - colGap, r2H);
    const vSubW = (vW - (2 * colGap)) / 2;
    addBlockToSlide(canvasSlide, 'stakeholders', margin + fW, r2Y, vSubW, r2H);
    addBlockToSlide(canvasSlide, 'impact', margin + fW + vSubW + colGap, r2Y, vSubW, r2H);
    const eSubW = (eW - (3 * colGap)) / 3;
    addBlockToSlide(canvasSlide, 'methodology', margin + fW + vW, r2Y, eSubW, r2H);
    addBlockToSlide(canvasSlide, 'data', margin + fW + vW + eSubW + colGap, r2Y, eSubW, r2H);
    addBlockToSlide(canvasSlide, 'resources', margin + fW + vW + (eSubW * 2) + (colGap * 2), r2Y, eSubW, r2H);

    const r3Y = 5.3;
    const r3H = 1.5;
    const valW = canvasW / 6;
    const riskW = (canvasW * 5) / 6;
    addBlockToSlide(canvasSlide, 'evidence_criteria', margin, r3Y, valW - colGap, r3H);
    const riskSubW = (riskW - (4 * colGap)) / 4;
    addBlockToSlide(canvasSlide, 'milestones', margin + valW, r3Y, riskSubW, r3H);
    addBlockToSlide(canvasSlide, 'decision_points', margin + valW + riskSubW + colGap, r3Y, riskSubW, r3H);
    addBlockToSlide(canvasSlide, 'risks', margin + valW + (riskSubW * 2) + (colGap * 2), r3Y, riskSubW, r3H);
    addBlockToSlide(canvasSlide, 'contingencies', margin + valW + (riskSubW * 3) + (colGap * 3), r3Y, riskSubW, r3H);

    const ftrY = 6.9;
    const ftrH = 0.5;
    const cW = (canvasW - (3 * colGap)) / 4;
    addBlockToSlide(canvasSlide, 'timeline', margin, ftrY, cW, ftrH);
    addBlockToSlide(canvasSlide, 'budget', margin + cW + colGap, ftrY, cW, ftrH);
    addBlockToSlide(canvasSlide, 'ethics', margin + (cW * 2) + (colGap * 2), ftrY, cW, ftrH);
    addBlockToSlide(canvasSlide, 'access', margin + (cW * 3) + (colGap * 3), ftrY, cW, ftrH);

    pptx.writeFile({ fileName: `${project.name.replace(/\s+/g, '_')}_Research_Compass.pptx` });
  };

  const handleGenerateAbstract = async () => {
    setShowDraftMenu(false);
    setIsGeneratingDraft(true);
    setProcessingStatus("Generating concise research abstract...");
    try {
      const text = await generateAbstract(project.blocks, project.name);
      setDraftContent({ type: "Scientific Abstract", text });
    } catch (e) { alert("Generation failed."); }
    finally { setIsGeneratingDraft(false); setProcessingStatus(""); }
  };

  const handleGenerateGrantOutline = async () => {
    setShowDraftMenu(false);
    setIsGeneratingDraft(true);
    setProcessingStatus("Generating structured grant outline...");
    try {
      const text = await generateGrantOutline(project.blocks, project.name);
      setDraftContent({ type: "Structured Grant Outline", text });
    } catch (e) { alert("Generation failed."); }
    finally { setIsGeneratingDraft(false); setProcessingStatus(""); }
  };

  const renderBlock = (id: BlockId) => (
    <CanvasBlock 
      key={id} block={project.blocks[id]} 
      onAddItem={handleAddItem} onUpdateItemText={handleUpdateItemText} 
      onDeleteItem={handleDeleteItem} activeView="Full"
      linkingState={{ active: false, sourceId: null }} onStartLink={() => {}} onEndLink={() => {}}
    />
  );

  const isBusy = isChecking || isRefining || isGeneratingDraft || isImporting || !!fixingWarning;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900 relative">
      {isBusy && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[150] bg-indigo-100 overflow-hidden">
          <div className="h-full bg-indigo-600 animate-progress-indeterminate w-1/3 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-3 grid grid-cols-3 items-center z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowBackpack(!showBackpack)} className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg shadow-sm transition-colors group flex items-center gap-2 px-3">
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              <span className="text-[10px] font-black uppercase tracking-tight">Vault</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight truncate max-w-[200px]">{project.name}</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Research Project Compass</p>
            </div>
          </div>
          <div className="flex justify-center">
            <button onClick={() => setShowWizard(!showWizard)} className={`px-8 py-2.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 ${showWizard ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              {showWizard ? 'HIDE ASSISTANT' : 'GUIDE ME'}
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={handleReset} className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 border border-rose-100 shadow-sm transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              RESET
            </button>
            <button onClick={handleNewProject} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 border border-indigo-100 shadow-sm transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              NEW COMPASS
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 overflow-y-auto bg-slate-200 scrollbar-hide relative">
          <div className="max-w-[1800px] mx-auto space-y-3 pb-8">
            {/* Logical Warnings Alert */}
            {warnings.length > 0 && (
              <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-3 shadow-md animate-in slide-in-from-top duration-300">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span className="text-sm font-bold text-amber-900 uppercase tracking-tight">Logical Audit Results</span>
                  </div>
                  <button onClick={() => setWarnings([])} className="text-amber-500 hover:text-amber-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="bg-white/60 p-2.5 rounded-lg flex justify-between items-center gap-4">
                      <p className="text-xs text-amber-900 font-medium leading-relaxed">{w}</p>
                      <button 
                        onClick={() => handleFixGap(w)} 
                        disabled={!!fixingWarning}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md text-[10px] font-bold shadow-sm transition-all shrink-0 active:scale-95 disabled:opacity-50"
                      >
                        {fixingWarning === w ? "FIXING..." : "AUTO-FIX"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            <button onClick={handleRefineCanvas} disabled={isRefining} className={`px-4 py-1.5 rounded-lg font-bold text-[11px] border transition-all flex items-center gap-2 ${isRefining ? 'bg-indigo-50 text-indigo-300 border-indigo-100 cursor-not-allowed' : 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm active:scale-95'}`}>
              {isRefining && <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isRefining ? 'REFINING...' : 'AI REFINE'}
            </button>
            <button onClick={runLogicCheck} disabled={isChecking} className={`bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-2 transition-all ${isChecking ? 'opacity-50' : 'active:scale-95'}`}>
              {isChecking && <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isChecking ? 'SCANNING...' : 'LOGIC CHECK'}
            </button>
          </div>
          <div className="flex gap-2 relative">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf,.doc,.docx" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className={`bg-slate-50 border border-slate-200 hover:bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all ${isImporting ? 'opacity-50' : 'active:scale-95'}`}>
              {isImporting ? 'PARSING...' : 'IMPORT'}
            </button>
            <button onClick={handleExportPPT} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1.5 active:scale-95">
              EXPORT PPT
            </button>
            <div className="relative" ref={draftMenuRef}>
              <button 
                onClick={() => setShowDraftMenu(!showDraftMenu)} 
                disabled={isGeneratingDraft} 
                className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all flex items-center gap-2 ${isGeneratingDraft ? 'opacity-50' : 'active:scale-95'}`}
              >
                {isGeneratingDraft ? 'WRITING...' : 'GENERATE DRAFT'}
                <svg className={`w-3 h-3 transition-transform ${showDraftMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {showDraftMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-[100]">
                  <button onClick={handleGenerateAbstract} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-100 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    RESEARCH ABSTRACT
                  </button>
                  <button onClick={handleGenerateGrantOutline} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    GRANT OUTLINE
                  </button>
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>

      {processingStatus && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 border border-slate-700">
          <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-xs font-bold uppercase tracking-wider">{processingStatus}</span>
        </div>
      )}

      {(isImporting || isRefining || isGeneratingDraft) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-indigo-100 flex flex-col items-center gap-6 max-w-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-50"><div className="h-full bg-indigo-600 animate-progress-indeterminate w-1/3"></div></div>
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-4 bg-indigo-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
            </div>
            <div><h3 className="text-xl font-bold text-slate-800">Neural Intelligence Active</h3><p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed px-4">{processingStatus || "Processing your research data..."}</p></div>
          </div>
        </div>
      )}

      {showBackpack && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
          <div className="w-80 h-full shadow-2xl animate-in slide-in-from-left duration-500"><ProjectBackpack onSelect={handleSelectProject} currentProjectId={project.id} onClose={() => setShowBackpack(false)} /></div>
          <div className="flex-1 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowBackpack(false)} />
        </div>
      )}

      {showWizard && (
        <aside className="w-[480px] border-l bg-white shadow-2xl shrink-0 flex flex-col z-50 animate-in slide-in-from-right duration-300"><DiscoveryCanvasWizard onUpdateCanvas={handleUpdateCanvasFromWizard} onClose={() => setShowWizard(false)} /></aside>
      )}

      {draftContent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 leading-none">{draftContent.type}</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Generated by Gemini 3 Pro</p>
                </div>
              </div>
              <button onClick={() => setDraftContent(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-white">
              <div className="max-w-3xl mx-auto whitespace-pre-wrap text-slate-700 font-medium leading-loose text-[15px] font-serif">
                {draftContent.text}
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 shadow-inner">
              <button onClick={() => { navigator.clipboard.writeText(draftContent.text); alert("Draft copied."); }} className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                COPY TEXT
              </button>
              <button onClick={() => setDraftContent(null)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors">CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
