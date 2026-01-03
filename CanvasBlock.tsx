
import React, { useState, useRef, useEffect } from 'react';
import { CanvasBlock as ICanvasBlock, CanvasItem, SpaceId } from '../types';

interface BlockProps {
  block: ICanvasBlock;
  onAddItem: (blockId: string, text: string) => void;
  onUpdateItemText: (blockId: string, itemId: string, text: string) => void;
  onDeleteItem: (blockId: string, itemId: string) => void;
  onUpdateStatus?: (blockId: string, itemId: string, status: 'pending' | 'validated' | 'falsified') => void;
  activeView: 'PI' | 'Lab' | 'Full';
  linkingState: { active: boolean; sourceId: string | null };
  onStartLink: (itemId: string) => void;
  onEndLink: (itemId: string) => void;
}

const getSpaceColors = (space: SpaceId) => {
  switch (space) {
    case 'PROBLEM': return { text: 'text-indigo-600', bg: 'bg-indigo-50/50', dot: 'bg-indigo-400', border: 'border-indigo-100', accent: 'bg-indigo-600' };
    case 'CLAIM': return { text: 'text-emerald-600', bg: 'bg-emerald-50/50', dot: 'bg-emerald-400', border: 'border-emerald-100', accent: 'bg-emerald-600' };
    case 'VALUE': return { text: 'text-orange-600', bg: 'bg-orange-50/50', dot: 'bg-orange-400', border: 'border-orange-100', accent: 'bg-orange-600' };
    case 'EXECUTION': return { text: 'text-violet-600', bg: 'bg-violet-50/50', dot: 'bg-violet-400', border: 'border-violet-100', accent: 'bg-violet-600' };
    case 'VALIDATION': return { text: 'text-sky-600', bg: 'bg-sky-50/50', dot: 'bg-sky-400', border: 'border-sky-100', accent: 'bg-sky-600' };
    case 'RISK': return { text: 'text-amber-600', bg: 'bg-amber-50/50', dot: 'bg-amber-400', border: 'border-amber-100', accent: 'bg-amber-600' };
    case 'CONSTRAINTS': return { text: 'text-zinc-600', bg: 'bg-zinc-50/50', dot: 'bg-zinc-400', border: 'border-zinc-100', accent: 'bg-zinc-600' };
    default: return { text: 'text-slate-600', bg: 'bg-slate-50/50', dot: 'bg-slate-400', border: 'border-slate-100', accent: 'bg-slate-600' };
  }
};

const EditableItem: React.FC<{
  item: CanvasItem;
  dotColor: string;
  onUpdateText: (text: string) => void;
  onDelete: () => void;
}> = ({ item, dotColor, onUpdateText, onDelete }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [item.text]);

  return (
    <div className="group relative p-1.5 text-[11px] hover:bg-white/60 rounded transition-colors flex gap-2 items-start">
      <div className={`w-1 h-1 rounded-full ${dotColor} mt-1.5 shrink-0`} />
      <textarea
        ref={textareaRef}
        rows={1}
        value={item.text}
        onChange={(e) => {
          onUpdateText(e.target.value);
          autoResize();
        }}
        className="flex-1 bg-transparent border-none outline-none resize-none overflow-hidden p-0 m-0 focus:ring-0 leading-tight text-slate-700 font-medium"
      />
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-400 transition-opacity">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  );
};

export const CanvasBlock: React.FC<BlockProps> = ({ 
  block, onAddItem, onUpdateItemText, onDeleteItem
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
        {block.items.length === 0 && <span className="text-[10px] text-slate-300 italic px-1">Ready for input...</span>}
        {block.items.map(item => (
          <EditableItem 
            key={item.id} 
            item={item} 
            dotColor={colors.dot}
            onUpdateText={(text) => onUpdateItemText(block.id, item.id, text)}
            onDelete={() => onDeleteItem(block.id, item.id)}
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
            placeholder="+"
            className="flex-1 text-[10px] p-1.5 bg-slate-50 border-none rounded outline-none focus:ring-1 focus:ring-slate-200 text-slate-600 placeholder:text-slate-300"
          />
          {inputValue && (
            <button onClick={handleAdd} className="p-1 text-indigo-500 hover:text-indigo-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd"></path></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
