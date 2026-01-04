
import React, { useEffect, useState, useCallback } from 'react';
import { Thread } from '../types';

interface LogicThreadsProps {
  threads: Thread[];
  containerRef: React.RefObject<HTMLDivElement>;
}

export const LogicThreads: React.FC<LogicThreadsProps> = ({ threads, containerRef }) => {
  const [paths, setPaths] = useState<string[]>([]);

  const calculatePaths = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const newPaths = threads.map(thread => {
      const sourceEl = document.querySelector(`[data-item-id="${thread.sourceId}"]`);
      const targetEl = document.querySelector(`[data-item-id="${thread.targetId}"]`);
      
      if (!sourceEl || !targetEl) return '';
      
      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      
      // Calculate centers relative to container
      const x1 = (sourceRect.left + sourceRect.width / 2) - containerRect.left;
      const y1 = (sourceRect.top + sourceRect.height / 2) - containerRect.top;
      const x2 = (targetRect.left + targetRect.width / 2) - containerRect.left;
      const y2 = (targetRect.top + targetRect.height / 2) - containerRect.top;
      
      // Create a smooth cubic bezier path
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const controlDist = Math.min(dx, dy) * 0.5 + 20;
      
      return `M ${x1} ${y1} C ${x1 + controlDist} ${y1}, ${x2 - controlDist} ${y2}, ${x2} ${y2}`;
    }).filter(p => p !== '');
    
    setPaths(newPaths);
  }, [threads, containerRef]);

  useEffect(() => {
    calculatePaths();
    window.addEventListener('resize', calculatePaths);
    const observer = new MutationObserver(calculatePaths);
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }
    return () => {
      window.removeEventListener('resize', calculatePaths);
      observer.disconnect();
    };
  }, [calculatePaths, containerRef]);

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ minHeight: '100%' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" opacity="0.4" />
        </marker>
      </defs>
      {paths.map((path, i) => (
        <path
          key={i}
          d={path}
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          opacity="0.3"
          markerEnd="url(#arrowhead)"
          className="animate-dash"
        />
      ))}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </svg>
  );
};
