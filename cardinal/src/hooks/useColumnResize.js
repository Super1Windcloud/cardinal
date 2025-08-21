import { useState, useRef, useCallback } from 'react';
import { DEFAULT_COL_WIDTHS } from '../constants';

export function useColumnResize() {
  const [colWidths, setColWidths] = useState(DEFAULT_COL_WIDTHS);
  const resizingRef = useRef(null);

  const onResizeStart = useCallback((key) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    resizingRef.current = { 
      key, 
      startX: e.clientX, 
      startW: colWidths[key] 
    };
    
    window.addEventListener('mousemove', onResizing);
    window.addEventListener('mouseup', onResizeEnd, { once: true });
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [colWidths]);

  const onResizing = useCallback((e) => {
    const ctx = resizingRef.current;
    if (!ctx) return;
    
    const delta = e.clientX - ctx.startX;
    const rootStyle = getComputedStyle(document.documentElement);
    const minW = parseInt(rootStyle.getPropertyValue('--col-min-width')) || 80;
    const maxW = parseInt(rootStyle.getPropertyValue('--col-max-width')) || 1200;
    const nextW = Math.max(minW, Math.min(maxW, ctx.startW + delta));
    
    setColWidths((w) => ({ ...w, [ctx.key]: nextW }));
  }, []);

  const onResizeEnd = useCallback(() => {
    resizingRef.current = null;
    window.removeEventListener('mousemove', onResizing);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, [onResizing]);

  return {
    colWidths,
    onResizeStart
  };
}
