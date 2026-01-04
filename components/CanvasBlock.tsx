
import React, { useState, useRef, useEffect } from 'react';
import { CanvasBlock as ICanvasBlock, CanvasItem, SpaceId } from '../types';

interface BlockProps {
  block: ICanvasBlock;
  onAddItem: (blockId: string, text: string) => void;
  onUpdateItemText: (blockId: string, itemId: string, text: string) => void;
  onDeleteItem: (blockId: string, itemId: string) => void;
  onUpdateItem?: (blockId: string, itemId: string, updates: Partial<CanvasItem>) => void;
  activeView: 'PI' | 'Lab' | 'Full';
  linkingState?: { active: boolean; sourceId: string | null };
  onStartLink?: (itemId: string) => void;
  onEndLink?: (itemId: string) => void;
}

const getSpaceColors = (space: SpaceId) => {
  switch (space) {
    case 'PROBLEM': return { text: 'text-indigo-600', bg: 'bg-indigo-50/50', dot: 'bg-indigo-400', accent: 'bg-indigo-600' };
    case 'CLAIM': return { text: 'text-emerald-600', bg: 'bg-emerald-50/50', dot: 'bg-emerald-400', accent: 'bg-emerald-600' };
    case 'VALUE': return { text: 'text-orange-600', bg: 'bg-orange-50/50', dot: 'bg-orange-400', accent: 'bg-orange-600' };
    case 'EXECUTION': return { text: 'text-violet-600', bg: 'bg-violet-50/50', dot: 'bg-violet-400', accent: 'bg-violet-600' };
    case 'VALIDATION': return { text: 'text-sky-600', bg: 'bg-sky-50/50', dot: 'bg-sky-400', accent: 'bg-sky-600' };
    case 'RISK': return { text: 'text-amber-600', bg: 'bg-amber-50/50', dot: 'bg-amber-400', accent: 'bg-amber-600' };
    case 'CONSTRAINTS': return { text: 'text-zinc-600', bg: 'bg-zinc-50/50', dot: 'bg-zinc-400', accent: 'bg-zinc-600' };
    default: return { text: 'text-slate-600', bg: 'bg-slate-50/50', dot: 'bg-slate-400', accent: 'bg-slate-600' };
  }
};

const EditableItem: React.FC<{
  item: CanvasItem;
  dotColor: string;
  onUpdateItem: (updates: Partial<CanvasItem>) => void;
  onDelete: () => void;
  isLinking?: boolean;
  onStartLink?: () => void;
  onEndLink?: () => void;
}> = ({ item, dotColor, onUpdateItem, onDelete, isLinking, onStartLink, onEndLink }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [item.text]);

  const killSwitchActive = item.isKillCriterion;

  return (
    <div 
      data-item-id={item.id}
      className={`group relative p-1.5 text-[11px] rounded transition-all flex gap-2 items-start ${
        killSwitchActive ? 'bg-rose-50 border border-rose-100 shadow-[0_0_8px_rgba(244,63,94,0.15)] animate-pulse-subtle' : 'hover:bg-slate-50 border border-transparent'
      } ${isLinking ? 'bg-indigo-50 border-indigo-200' : ''}`}
      onClick={onEndLink}
    >
      <div className={`w-1 h-1 rounded-full ${killSwitchActive ? 'bg-rose-500' : dotColor} mt-1.5 shrink-0`} />
      
      <textarea
        ref={textareaRef}
        rows={1}
        value={item.text}
        onChange={(e) => onUpdateItem({ text: e.target.value })}
        className="flex-1 bg-transparent border-none outline-none resize-none overflow-hidden p-0 m-0 focus:ring-0 leading-tight text-slate-700 font-medium"
      />

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onStartLink?.(); }} 
          className="p-1 text-indigo-300 hover:text-indigo-600"
          title="Connect to another node"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdateItem({ isKillCriterion: !item.isKillCriterion }); }} 
          title="Mark as Critical Kill Criterion"
          className={`p-1 ${killSwitchActive ? 'text-rose-500' : 'text-slate-300 hover:text-rose-500'}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" /></svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-300 hover:text-red-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
};

export const CanvasBlock: React.FC<BlockProps> = ({ 
  block, onAddItem, onUpdateItemText, onDeleteItem, onUpdateItem, linkingState, onStartLink, onEndLink
}) => {
  const [inputValue, setInputValue] = useState('');
  const colors = getSpaceColors(block.category);

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddItem(block.id, inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col bg-white h-full border border-slate-200 shadow-sm rounded-lg overflow-hidden group/block">
      <div className={`p-2 border-b border-slate-100 flex items-start gap-2 ${colors.bg}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${colors.accent} mt-1.5`} />
        <div>
          <h3 className={`text-[10px] font-black uppercase tracking-wider leading-none ${colors.text}`}>{block.title}</h3>
          <p className="text-[9px] text-slate-400 italic mt-0.5 leading-tight line-clamp-1">{block.description}</p>
        </div>
      </div>

      <div className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-hide min-h-[40px]">
        {block.items.length === 0 && <span className="text-[10px] text-slate-300 italic px-1">Ready...</span>}
        {block.items.map(item => (
          <EditableItem 
            key={item.id} 
            item={item} 
            dotColor={colors.dot}
            onUpdateItem={(updates) => onUpdateItem?.(block.id, item.id, updates)}
            onDelete={() => onDeleteItem(block.id, item.id)}
            isLinking={linkingState?.sourceId === item.id}
            onStartLink={() => onStartLink?.(item.id)}
            onEndLink={() => linkingState?.active && onEndLink?.(item.id)}
          />
        ))}
      </div>

      <div className="p-2 pt-0">
        <div className="flex items-center gap-1 border-t border-slate-50 pt-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add info..."
            className="flex-1 text-[10px] p-1.5 bg-slate-50 border-none rounded outline-none focus:ring-1 focus:ring-slate-200 text-slate-600 placeholder:text-slate-300"
          />
        </div>
      </div>
    </div>
  );
};
