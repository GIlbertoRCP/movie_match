import { useEffect, useRef, useState } from 'react';

// The visible part of the page, which shrinks when the on-screen keyboard opens.
// iOS Safari keeps the layout viewport (and 100dvh) full height and scrolls the
// page instead, so game screens size themselves from visualViewport.
//
// "Keyboard open" means a text field has focus AND the visible height has
// dropped well below what it was at this width before typing. Comparing
// against that baseline (not a share of the screen) keeps short desktop
// windows and phones in landscape from reading as keyboard-open.
const KEYBOARD_MIN_PX = 120;

function measure() {
  const vv = window.visualViewport;
  const el = document.activeElement;
  return {
    height: vv ? vv.height : window.innerHeight,
    top: vv ? vv.offsetTop : 0,
    width: vv ? vv.width : window.innerWidth,
    typing: el?.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search'),
  };
}

export function useVisualViewport() {
  // Tallest visible height seen at the current width; reset when the width
  // changes (rotation, window resize).
  const baseline = useRef({ width: 0, height: 0 });

  const compute = () => {
    const m = measure();
    const b = baseline.current;
    if (m.width !== b.width) baseline.current = { width: m.width, height: m.height };
    else if (m.height > b.height) b.height = m.height;
    const keyboardOpen = m.typing && baseline.current.height - m.height >= KEYBOARD_MIN_PX;
    return { height: m.height, top: m.top, keyboardOpen };
  };

  const [viewport, setViewport] = useState(compute);

  useEffect(() => {
    // Cheap to read; React skips the render when nothing changed.
    const update = () =>
      setViewport((prev) => {
        const next = compute();
        return next.height === prev.height && next.top === prev.top && next.keyboardOpen === prev.keyboardOpen ? prev : next;
      });
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
    // compute only reads refs and the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return viewport;
}
