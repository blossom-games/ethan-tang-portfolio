/* ============================================
   ETHAN TANG — AMBIENT AUDIO ENGINE
   WebAudio, fully generated (no files). Passive by default:
   nothing starts until the user opts in via the nav toggle.
   ============================================ */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let ctx = null;
  let master = null;
  let ambGain = null;
  let noiseSrc = null;
  let filter = null;
  let lfo = null;
  let enabled = false;

  const toggles = [document.getElementById('soundToggle'), document.getElementById('soundToggleMobile')];

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // --- ambient bed: filtered pink-ish noise, slow LFO on the filter ---
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // leaky integrator ≈ pink noise
      data[i] = last * 3.5;
    }
    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    noiseSrc.loop = true;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.5;
    ambGain = ctx.createGain();
    ambGain.gain.value = 0.05;
    noiseSrc.connect(filter);
    filter.connect(ambGain);
    ambGain.connect(master);

    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noiseSrc.start();
  }

  function setEnabled(on) {
    enabled = on;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(on ? 0.6 : 0, now, 0.15);
    toggles.forEach((t) => {
      if (t) {
        t.setAttribute('aria-pressed', String(on));
        const icon = t.querySelector('.sound-toggle__icon');
        if (icon) icon.textContent = on ? '🔊' : '🔇';
      }
    });
  }

  // Scroll-speed pitch: faster scrolling brightens the bed.
  // Called from the Lenis scroll handler — cheap, no allocations.
  window.__audioScroll = function (speed) {
    if (!ctx || !enabled) return;
    const f = Math.min(2400, 320 + Math.abs(speed) * 60);
    filter.frequency.setTargetAtTime(f, ctx.currentTime, 0.08);
  };

  // Hover blip (soft click) for links/buttons — hover-only.
  window.__audioHover = function () {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200 + Math.random() * 300, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.02, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.09);
  };

  // Click confirm (soft) for the toggle itself.
  window.__audioClick = function () {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.13);
  };

  // Toggle wiring (desktop + mobile share one state).
  toggles.forEach((t) => {
    if (!t) return;
    t.hidden = false; // Audio is available — show the toggle
    t.addEventListener('click', () => {
      if (!ctx) {
        build(); // first opt-in also builds (user gesture → audio allowed)
        setEnabled(true);
      } else {
        setEnabled(!enabled);
      }
      window.__audioClick();
    });
  });
})();
