/* ============================================
   FLUID CURSOR BOOT — loads fluid.js (WebGL sim)
   ============================================ */
import useFluidCursor from './fluid.js';

// Guards: reduced motion and coarse pointers skip the sim entirely
// (a full-screen WebGL fluid is the heaviest thing on the page).
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !window.matchMedia('(pointer: coarse)').matches &&
    document.getElementById('fluid')) {
  try {
    const api = useFluidCursor();
    if (api) window.__fluid = api; // main.js hooks tint/burst via this
  } catch (err) {
    console.warn('Fluid cursor unavailable:', err);
  }
}
