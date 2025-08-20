import React, { useEffect, useMemo, useRef, useState } from 'react';

// Render text with a middle ellipsis that fits the available width of its grid cell.
export function MiddleEllipsis({ text, className }) {
  const containerRef = useRef(null);
  const [display, setDisplay] = useState(text || '');

  const ctx = useMemo(() => {
    const canvas = document.createElement('canvas');
    return canvas.getContext('2d');
  }, []);

  useEffect(() => {
    function compute() {
      const el = containerRef.current;
      if (!el || !ctx) return;
      const { width: rawWidth } = el.getBoundingClientRect();
      const available = Math.max(0, rawWidth - 2); // small buffer
      const str = text || '';
      // Set canvas font to match element font to get accurate measurements
      const cs = window.getComputedStyle(el);
      ctx.font = cs.font || `${cs.fontStyle} ${cs.fontVariant} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;

      // If it already fits, use raw text
      const fullWidth = ctx.measureText(str).width;
      if (fullWidth <= available) {
        setDisplay(str);
        return;
      }

      const ell = '…';
      const ellW = ctx.measureText(ell).width;
      if (ellW > available) {
        setDisplay('');
        return;
      }

      // Prefer to keep at least the extension and a few more tail chars
      const lastDot = str.lastIndexOf('.');
      const extLen = lastDot > 0 ? (str.length - lastDot) : 0; // includes dot
      const minRight = Math.min(str.length - 1, Math.max(8, extLen + 2));

      // Binary search for maximum kept characters K such that prefix + ellipsis + suffix fits
      let low = 1, high = Math.max(1, str.length - 1);
      let best = { left: 1, right: 0 };
      const fits = (left, right) => {
        const w = ctx.measureText(str.slice(0, left)).width + ellW + ctx.measureText(str.slice(str.length - right)).width;
        return w <= available;
      };

      while (low <= high) {
        const mid = (low + high) >> 1; // total kept (left + right)
        // Bias to keep more on the right (extension/tail), like Finder
        const rightBias = 0.6;
        const right = Math.max(1, Math.min(str.length - 1, Math.max(minRight, Math.floor(mid * rightBias))));
        const left = Math.max(1, Math.min(str.length - right - 1, mid - right));
        if (left <= 0 || right <= 0) {
          high = mid - 1;
          continue;
        }
        if (fits(left, right)) {
          best = { left, right };
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const leftStr = str.slice(0, best.left);
      const rightStr = str.slice(str.length - best.right);
      setDisplay(`${leftStr}${ell}${rightStr}`);
    }

  compute();
  const ro = new ResizeObserver(() => compute());
  const el = containerRef.current;
  if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [text, ctx]);

  return (
    <span ref={containerRef} className={className} title={text}>
      {display}
    </span>
  );
}
