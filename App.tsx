
import React, { useState, useRef } from 'react';
import { ProjectState, BlockId, CanvasItem, Thread, CanvasBlock as ICanvasBlock, SpaceId } from './types';
import { INITIAL_BLOCKS } from './constants';
import { CanvasBlock } from './components/CanvasBlock';
import { DiscoveryCanvasWizard } from './components/DiscoveryCanvasWizard';
import { runOrphanCheck, generateGrantDraft, refineCanvas, processDocumentImport, fixLogicalGap } from './services/geminiService';
// @ignore
// @ts-ignore
import pptxgen from 'pptxgenjs';

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>({
    name: "My Compass",
    blocks: JSON.parse(JSON.stringify(INITIAL_BLOCKS)),
    threads: [],
  });

  const [activeView] = useState<'PI' | 'Lab' | 'Full'>('Full');
  const [showWizard, setShowWizard] = useState(false);
  const [linkingState] = useState<{ active: boolean; sourceId: string | null }>({ active: false, sourceId: null });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [fixingWarning, setFixingWarning] = useState<string | null>(null);
  const [lastBlocksState, setLastBlocksState] = useState<Record<BlockId, ICanvasBlock> | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [grantDraft, setGrantDraft] = useState<string | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      alert("AI was unable to resolve this gap. Please try manual correction.");
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
    
    reader.onerror = () => {
      alert("Error reading file.");
      setIsImporting(false);
    };

    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (!result) {
        alert("File content is empty.");
        setIsImporting(false);
        return;
      }

      try {
        const extractedData = await processDocumentImport(result, file.type);
        
        setProject(prev => {
          const newBlocks = { ...prev.blocks };
          let foundCount = 0;
          
          Object.entries(extractedData).forEach(([key, strings]) => {
            if (newBlocks[key as BlockId] && Array.isArray(strings) && strings.length > 0) {
              const newItems = strings.map((t, idx) => ({ 
                id: `import-${key}-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
                text: t as string 
              }));
              newBlocks[key as BlockId].items = [...newBlocks[key as BlockId].items, ...newItems];
              foundCount += strings.length;
            }
          });

          if (foundCount === 0) {
            alert("AI could not find any relevant research components in this document.");
          } else {
            console.log(`Successfully imported ${foundCount} items.`);
          }

          return { ...prev, blocks: newBlocks };
        });
      } catch (err: any) { 
        console.error("Import Error Details:", err);
        alert(`Parsing failed: ${err.message || "An unexpected error occurred during AI analysis."}`); 
      } finally { 
        setIsImporting(false); 
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    // Use readAsDataURL for binary/multimodal formats so Gemini can parse them directly
    const binaryMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (binaryMimeTypes.includes(file.type)) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleGenerateGrant = async () => {
    setIsGeneratingDraft(true);
    try {
      const draft = await generateGrantDraft(project.blocks, project.name);
      setGrantDraft(draft);
    } catch (e) { alert("Draft generation failed."); } finally { setIsGeneratingDraft(false); }
  };

  const handleExportPPT = () => {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';

    const addBlockToSlide = (currentSlide: any, blockId: BlockId, x: number, y: number, w: number, h: number, color: string, isCompact: boolean = false) => {
      const block = project.blocks[blockId];
      if (!block) return;
      currentSlide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 0.5 } });
      currentSlide.addText(block.title, { x: x + 0.05, y: y + 0.05, w: w - 0.1, h: isCompact ? 0.2 : 0.3, fontSize: isCompact ? 7 : 12, bold: true, color: color });
      const itemsText = block.items.map(i => `• ${i.text}`).join('\n');
      currentSlide.addText(itemsText || '...', { 
        x: x + 0.05, y: y + (isCompact ? 0.25 : 0.4), w: w - 0.1, h: h - (isCompact ? 0.3 : 0.5), 
        fontSize: isCompact ? 6 : 9, color: '334155', valign: 'top' 
      });
    };

    const colors = {
      problem: '4F46E5',
      claim: '059669',
      value: 'EA580C', // Orange
      execution: '7C3AED',
      validation: '0284C7',
      risk: 'D97706', // Gold Yellow (Amber)
      constraints: '27272A'
    };

    // Slide 1: Title
    let slide = pptx.addSlide();
    slide.background = { color: 'F1F5F9' };
    slide.addText(project.name, { x: 1, y: 1.5, w: '80%', fontSize: 44, bold: true, color: '1E293B', align: 'center' });
    slide.addText("Research Project Compass Overview", { x: 1, y: 2.5, w: '80%', fontSize: 18, color: '64748B', align: 'center' });

    // Slide 2: FULL CANVAS OVERVIEW
    slide = pptx.addSlide();
    slide.addText("Project Compass Overview", { x: 0.5, y: 0.15, w: 12, fontSize: 14, bold: true, color: '1E293B' });
    
    const row1Y = 0.5, row1H = 2.0;
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: row1Y, w: 5, h: row1H, fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 } });
    slide.addText("Problem Space", { x: 0.6, y: row1Y + 0.05, fontSize: 8, bold: true, color: colors.problem });
    addBlockToSlide(slide, 'problem_context', 0.6, row1Y + 0.25, 1.1, 0.8, colors.problem, true);
    addBlockToSlide(slide, 'prior_work', 0.6, row1Y + 1.1, 1.1, 0.8, colors.problem, true);
    addBlockToSlide(slide, 'gaps_limits', 1.75, row1Y + 0.25, 1.1, 0.8, colors.problem, true);
    addBlockToSlide(slide, 'current_solutions', 1.75, row1Y + 1.1, 1.1, 0.8, colors.problem, true);

    slide.addShape(pptx.ShapeType.rect, { x: 5.6, y: row1Y, w: 7.2, h: row1H, fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 } });
    slide.addText("Claim Space", { x: 5.7, y: row1Y + 0.05, fontSize: 8, bold: true, color: colors.claim });
    addBlockToSlide(slide, 'questions_hypotheses', 5.7, row1Y + 0.25, 2.3, 1.6, colors.claim, true);
    addBlockToSlide(slide, 'novelty', 8.05, row1Y + 0.25, 2.3, 1.6, colors.claim, true);
    addBlockToSlide(slide, 'contribution', 10.4, row1Y + 0.25, 2.3, 1.6, colors.claim, true);

    const row2Y = 2.6, row2H = 1.8;
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: row2Y, w: 2.1, h: row2H, fill: { color: 'ECFDF5' }, line: { color: 'CBD5E1', width: 1 } });
    slide.addText("Claim Space", { x: 0.6, y: row2Y + 0.05, fontSize: 8, bold: true, color: colors.claim });
    addBlockToSlide(slide, 'aims_objectives', 0.6, row2Y + 0.25, 1.9, 1.4, colors.claim, true);

    slide.addShape(pptx.ShapeType.rect, { x: 2.7, y: row2Y, w: 4.0, h: row2H, fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 } });
    slide.addText("Value Space", { x: 2.8, y: row2Y + 0.05, fontSize: 8, bold: true, color: colors.value });
    addBlockToSlide(slide, 'stakeholders', 2.8, row2Y + 0.25, 1.85, 1.4, colors.value, true);
    addBlockToSlide(slide, 'impact', 4.75, row2Y + 0.25, 1.85, 1.4, colors.value, true);

    slide.addShape(pptx.ShapeType.rect, { x: 6.8, y: row2Y, w: 6.0, h: row2H, fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 } });
    slide.addText("Execution Space", { x: 6.9, y: row2Y + 0.05, fontSize: 8, bold: true, color: colors.execution });
    addBlockToSlide(slide, 'methodology', 6.9, row2Y + 0.25, 1.9, 1.4, colors.execution, true);
    addBlockToSlide(slide, 'data', 8.9, row2Y + 0.25, 1.9, 1.4, colors.execution, true);
    addBlockToSlide(slide, 'resources', 10.9, row2Y + 0.25, 1.8, 1.4, colors.execution, true);

    const row3Y = 4.5, row3H = 1.8;
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: row3Y, w: 2, h: row3H, fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 } });
    slide.addText("Validation", { x: 0.6, y: row3Y + 0.05, fontSize: 8, bold: true, color: colors.validation });
    addBlockToSlide(slide, 'evidence_criteria', 0.6, row3Y + 0.25, 1.8, 1.4, colors.validation, true);

    slide.addShape(pptx.ShapeType.rect, { x: 2.6, y: row3Y, w: 10.2, h: row3H, fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 } });
    slide.addText("Risk & Strategy Space", { x: 2.7, y: row3Y + 0.05, fontSize: 8, bold: true, color: colors.risk });
    addBlockToSlide(slide, 'milestones', 2.7, row3Y + 0.25, 2.4, 1.4, colors.risk, true);
    addBlockToSlide(slide, 'decision_points', 5.15, row3Y + 0.25, 2.4, 1.4, colors.risk, true);
    addBlockToSlide(slide, 'risks', 7.6, row3Y + 0.25, 2.4, 1.4, colors.risk, true);
    addBlockToSlide(slide, 'contingencies', 10.05, row3Y + 0.25, 2.4, 1.4, colors.risk, true);

    const footY = 6.4, footH = 0.8;
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: footY, w: 12.3, h: footH, fill: { color: '1E293B' }, line: { color: 'CBD5E1', width: 1 } });
    slide.addText("Constraints", { x: 0.6, y: footY + 0.25, fontSize: 10, bold: true, color: 'FFFFFF' });
    addBlockToSlide(slide, 'timeline', 2.0, footY + 0.05, 2.5, footH - 0.1, colors.constraints, true);
    addBlockToSlide(slide, 'budget', 4.6, footY + 0.05, 2.5, footH - 0.1, colors.constraints, true);
    addBlockToSlide(slide, 'ethics', 7.2, footY + 0.05, 2.5, footH - 0.1, colors.constraints, true);
    addBlockToSlide(slide, 'access', 9.8, footY + 0.05, 2.5, footH - 0.1, colors.constraints, true);

    pptx.writeFile({ fileName: `${project.name.replace(/\s+/g, '_')}_Research_Compass.pptx` });
  };

  const renderBlock = (id: BlockId) => (
    <CanvasBlock 
      key={id} block={project.blocks[id]} 
      onAddItem={handleAddItem} onUpdateItemText={handleUpdateItemText} 
      onDeleteItem={handleDeleteItem} activeView={activeView}
      linkingState={linkingState} onStartLink={() => {}} onEndLink={() => {}}
    />
  );

  const SplitColumn = ({ top, bottom }: { top: BlockId, bottom: BlockId }) => (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex-1 min-h-0">{renderBlock(top)}</div>
      <div className="flex-1 min-h-0">{renderBlock(bottom)}</div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900 relative">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-3 grid grid-cols-3 items-center z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 text-white p-2 rounded-lg shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{project.name}</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Research Project Compass</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={() => setShowWizard(!showWizard)} 
              className={`px-8 py-2.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 ${
                showWizard 
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              {showWizard ? 'HIDE ASSISTANT' : 'GUIDE ME'}
            </button>
          </div>

          <div className="flex justify-end gap-2">
          </div>
        </header>

        <main className="flex-1 p-3 overflow-y-auto bg-slate-200 scrollbar-hide">
          <div className="max-w-[1800px] mx-auto space-y-3">
            
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2 border-2 border-indigo-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-indigo-600 px-3 py-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase text-white tracking-tight">Problem Space</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 flex-1 min-h-[300px]">
                  <SplitColumn top="problem_context" bottom="prior_work" />
                  <SplitColumn top="gaps_limits" bottom="current_solutions" />
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
                <div className="bg-emerald-600 px-3 py-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase text-white tracking-tight">Claim Space</span>
                </div>
                <div className="p-2 flex-1 min-h-[260px]">
                  {renderBlock('aims_objectives')}
                </div>
              </div>
              <div className="col-span-2 border-2 border-orange-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-orange-600 px-3 py-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase text-white tracking-tight">Value Space</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 flex-1 min-h-[260px]">
                  {renderBlock('stakeholders')}
                  {renderBlock('impact')}
                </div>
              </div>
              <div className="col-span-3 border-2 border-violet-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-violet-600 px-3 py-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase text-white tracking-tight">Execution Space</span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2 flex-1 min-h-[260px]">
                  {renderBlock('methodology')}
                  {renderBlock('data')}
                  {renderBlock('resources')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-1 border-2 border-sky-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-sky-600 px-3 py-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase text-white tracking-tight">Validation</span>
                </div>
                <div className="p-2 flex-1 min-h-[240px]">
                  {renderBlock('evidence_criteria')}
                </div>
              </div>
              <div className="col-span-5 border-2 border-amber-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                <div className="bg-amber-600 px-3 py-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black uppercase text-white tracking-tight">Risk & Strategy Space</span>
                </div>
                <div className="grid grid-cols-4 gap-2 p-2 flex-1 min-h-[240px]">
                  {renderBlock('milestones')}
                  {renderBlock('decision_points')}
                  {renderBlock('risks')}
                  {renderBlock('contingencies')}
                </div>
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

        {warnings.length > 0 && (
          <div className="bg-rose-50 border-t border-rose-200 p-4 px-6 animate-in slide-in-from-bottom shrink-0 z-30">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-rose-500 text-white rounded p-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-rose-700">Logical Gaps Detected</h3>
              <button onClick={() => setWarnings([])} className="ml-auto text-rose-400 hover:text-rose-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warnings.map((w, i) => (
                <li key={i} className="text-[11px] text-rose-800 bg-white border border-rose-100 p-3 rounded-lg shadow-sm leading-snug flex gap-3 items-center">
                  <span className="font-black text-rose-400">0{i + 1}</span>
                  <div className="flex-1">{w}</div>
                  <button 
                    onClick={() => handleFixGap(w)} 
                    disabled={!!fixingWarning}
                    className="px-3 py-1 bg-rose-600 text-white text-[9px] font-bold rounded hover:bg-rose-700 transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {fixingWarning === w ? (
                      <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    )}
                    {fixingWarning === w ? 'FIXING...' : 'RESOLVE'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="bg-white border-t p-3 flex justify-between items-center shrink-0 z-40">
          <div className="flex gap-2">
            <button onClick={handleRefineCanvas} disabled={isRefining} className={`px-4 py-1.5 rounded-lg font-bold text-[11px] border transition-colors ${isRefining ? 'bg-slate-50 text-slate-300' : 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm'}`}>
              {isRefining ? 'REFINING...' : 'AI REFINE'}
            </button>
            {lastBlocksState && !isRefining && (
              <button onClick={handleRevertRefinement} className="px-4 py-1.5 rounded-lg font-bold text-[11px] bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                REVERT
              </button>
            )}
            <button onClick={runLogicCheck} disabled={isChecking} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm">
              {isChecking ? 'SCANNING...' : 'LOGIC CHECK'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf,.doc,.docx" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-slate-50 border border-slate-200 hover:bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
              {isImporting ? 'PARSING...' : 'IMPORT'}
            </button>
            <button onClick={handleExportPPT} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              EXPORT PPT
            </button>
            <button onClick={handleGenerateGrant} disabled={isGeneratingDraft} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all">
              {isGeneratingDraft ? 'WRITING...' : 'GENERATE DRAFT'}
            </button>
          </div>
        </footer>
      </div>

      {isImporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-indigo-100 flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Analyzing Document</h3>
              <p className="text-xs text-slate-500 mt-2">Gemini 3 Pro is mapping your research to the canvas. This supports PDF and Word docs natively.</p>
            </div>
          </div>
        </div>
      )}

      {showWizard && (
        <aside className="w-[480px] border-l bg-white shadow-2xl shrink-0 flex flex-col z-50 animate-in slide-in-from-right duration-300">
          <DiscoveryCanvasWizard onUpdateCanvas={handleUpdateCanvasFromWizard} onClose={() => setShowWizard(false)} />
        </aside>
      )}

      {grantDraft && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold">NSF-Style Project Summary</h2>
              <button onClick={() => setGrantDraft(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 prose prose-slate max-w-none text-sm leading-relaxed">
              <div className="whitespace-pre-wrap">{grantDraft}</div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => { navigator.clipboard.writeText(grantDraft || ''); alert("Draft copied to clipboard."); }} className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">Copy to Clipboard</button>
              <button onClick={() => setGrantDraft(null)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
