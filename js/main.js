/* ============================================
   ETHAN TANG — PORTFOLIO JS
   Lenis smooth scroll + GSAP ScrollTrigger
   ============================================ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  // Global perf observables — Lenis's scroll handler updates these; each
  // consumer derives everything else per frame from the one cached value
  // (one layout read, no re-querying).
  const scrollState = { y: window.scrollY };
  function updateScrollState() {
    scrollState.y = window.scrollY;
  }
  window.__scrollState = scrollState;

  /* ---------- PRELOADER ---------- */
  const preloader = document.getElementById('preloader');
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('preloader--done');
    setTimeout(() => preloader.remove(), 700);
  }

  /* ---------- NAV SCROLL STATE ---------- */
  const nav = document.getElementById('nav');
  function onScrollNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }

  /* ---------- SCROLL PROGRESS ---------- */
  // Owned by Motion One's scroll() in index.html (module script) — the
  // transform is updated off-thread there; no JS per frame needed here.

  /* ---------- MOBILE NAV TOGGLE ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  // Desktop: nav is in-flow and visible — aria-hidden must not apply.
  // Only the mobile menu (toggle visible) toggles aria-hidden.
  const isMobileNav = () => window.matchMedia('(max-width: 640px)').matches;
  function syncNavAria(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (isMobileNav()) navLinks.setAttribute('aria-hidden', String(!open));
    else navLinks.removeAttribute('aria-hidden');
    navLinks.classList.toggle('is-open', open);
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'false';
      syncNavAria(open);
      // Close on Escape; return focus to the toggle (menu is a dialog-like
      // overlay on mobile — Escape should dismiss and hand focus back).
      if (open) {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
            syncNavAria(false);
            navToggle.focus();
          }
        }, { once: true });
      }
    });
    // Close on outside click (taps on the page close the menu — a menu
    // that stays open over content is a classic mobile-UX failure).
    document.addEventListener('click', (e) => {
      if (navToggle.getAttribute('aria-expanded') === 'true' &&
          !e.target.closest('.nav__inner')) {
        syncNavAria(false);
      }
    }, { passive: true });
    // Close when a link is chosen (the anchor target is visible then).
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) syncNavAria(false);
    });
    // Resize across the 640px breakpoint: reset to desktop-visible state.
    window.addEventListener('resize', () => {
      if (!isMobileNav() && navToggle.getAttribute('aria-expanded') === 'true') {
        syncNavAria(false);
      } else if (!isMobileNav()) {
        navLinks.classList.remove('is-open');
        navLinks.removeAttribute('aria-hidden');
      }
    }, { passive: true });
  }

  /* ---------- THEME TOGGLE ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle ? themeToggle.querySelector('.theme-toggle__icon') : null;
  function getStoredTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☾' : '☀';
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
  }
  function initTheme() {
    const stored = getStoredTheme();
    if (stored) { applyTheme(stored); return; }
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(sysDark ? 'dark' : 'light');
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  /* ---------- CUSTOM CURSOR + SPOTLIGHT ---------- */
  // Position via transform/translate, not top/left — stays on the
  // compositor (gsap-performance: prefer transforms over layout props).
  const cursor = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursorRing');
  const cursorGlow = document.getElementById('cursorGlow');
  if (!prefersReduced && !isCoarse && cursor && cursorRing) {
    const pos = { x: -100, y: -100 };

    // quickTo reuses a single tween per property instead of creating new
    // tweens on every mousemove (gsap-performance: mouse followers).
    // Timings: 0.12s ring / 0.25s glow — tight enough to feel attached,
    // loose enough for the depth effect. (Was 0.3/0.55 — felt broken.)
    const ringXTo = gsap.quickTo(cursorRing, 'x', { duration: 0.12, ease: 'power3' });
    const ringYTo = gsap.quickTo(cursorRing, 'y', { duration: 0.12, ease: 'power3' });
    const glowXTo = cursorGlow ? gsap.quickTo(cursorGlow, 'x', { duration: 0.25, ease: 'power3' }) : null;
    const glowYTo = cursorGlow ? gsap.quickTo(cursorGlow, 'y', { duration: 0.25, ease: 'power3' }) : null;

    window.addEventListener('mousemove', (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      cursor.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      ringXTo(e.clientX);
      ringYTo(e.clientY);
      if (glowXTo && glowYTo) { glowXTo(e.clientX); glowYTo(e.clientY); }
    }, { passive: true });

    document.querySelectorAll('a, button, .project-card, .skill-pill').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursorRing.classList.add('is-active');
        if (window.__audioHover) window.__audioHover(); // hover blip
      });
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-active'));
    });
    // (The old fluid tint handler here was removed — it ran per-move and
    // overwrote the sim's palette; the palette is already site-accented.)
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  // Perf: mousemove fires at mouse-polling rate (60-240Hz) but the
  // compositor draws at most 60fps. Every per-move handler here batches
  // its work into ONE rAF pass — reading layout once per frame instead
  // of once per mouse event. This removes ~75% of the per-move cost.
  function initMagnetic() {
    if (prefersReduced) return;
    document.querySelectorAll('.magnetic').forEach((el) => {
      const strength = 0.35;
      let pending = null;
      const apply = () => {
        if (!pending) return;
        const r = el.getBoundingClientRect();
        const dx = pending.x - (r.left + r.width / 2);
        const dy = pending.y - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        pending = null;
      };
      el.addEventListener('mousemove', (e) => {
        pending = { x: e.clientX, y: e.clientY };
        requestAnimationFrame(apply);
      });
      el.addEventListener('mouseleave', () => {
        pending = null;
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ---------- STAT COUNTERS ---------- */
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const dur = 1200;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- FALLBACK REVEALS (no GSAP path) ---------- */
  function initFallbackReveals(hasGsap) {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    // If GSAP is present, it animates .reveal elements — the observer
    // must not fight it. GSAP's from() owns the hidden state.
    if (hasGsap) {
      els.forEach((el) => el.classList.remove('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- 3D PROJECT CARD TILT ---------- */
  // rAF-batched (see initMagnetic): one layout read + one transform
  // write per frame max, instead of per mousemove event.
  function initTilt() {
    if (prefersReduced || isCoarse) return;
    document.querySelectorAll('.project-card').forEach((card) => {
      let pending = null;
      const apply = () => {
        if (!pending) return;
        const r = card.getBoundingClientRect();
        const rx = ((pending.y - r.top) / r.height - 0.5) * -8;
        const ry = ((pending.x - r.left) / r.width - 0.5) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
        pending = null;
      };
      card.addEventListener('mousemove', (e) => {
        pending = { x: e.clientX, y: e.clientY };
        requestAnimationFrame(apply);
      });
      card.addEventListener('mouseleave', () => {
        pending = null;
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
      });
    });
  }

  /* ---------- CARD SPOTLIGHT (cursor-tracking glow) ---------- */
  // rAF-batched: one layout read + two custom-prop writes per frame.
  function initSpotlights() {
    if (isCoarse) return;
    document.querySelectorAll('.card, .project-card').forEach((el) => {
      let pending = null;
      const apply = () => {
        if (!pending) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((pending.x - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((pending.y - r.top) / r.height) * 100}%`);
        pending = null;
      };
      el.addEventListener('mousemove', (e) => {
        pending = { x: e.clientX, y: e.clientY };
        requestAnimationFrame(apply);
      });
    });
  }

  /* ---------- MAGNETIC HERO NAME CHARS ---------- */
  function initMagneticChars() {
    if (prefersReduced || isCoarse) return;
    const nameLine = document.querySelector('.hero__line--name');
    if (!nameLine) return;
    const chars = gsap.utils.toArray(nameLine.querySelectorAll('.hero__name-char'));
    if (!chars.length) return;
    // quickTo per char — one tween each, reused (gsap-performance).
    const magnetPairs = chars.map((ch) => ({
      xTo: gsap.quickTo(ch, 'x', { duration: 0.4, ease: 'power3' }),
      yTo: gsap.quickTo(ch, 'y', { duration: 0.4, ease: 'power3' }),
      ox: 0, oy: 0
    }));
    const strength = 22;
    // rAF-batched: char positions are cached once per frame (not per
    // move event) — the 4+ layout reads per char per move were the worst
    // mousemove cost on the page.
    let cachedRects = null;
    let lastMouse = null;
    const applyChars = () => {
      if (!lastMouse) return;
      const r = nameLine.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      chars.forEach((ch, i) => {
        const cr = cachedRects[i];
        const dx = lastMouse.x - (cr.left + cr.width / 2);
        const dy = lastMouse.y - (cr.top + cr.height / 2);
        const d = Math.hypot(dx, dy);
        const pull = d < 90 ? (1 - d / 90) * strength : 0;
        const ang = Math.atan2(dy, dx);
        // Push the char gently AWAY from the cursor; restore to base.
        magnetPairs[i].xTo(-Math.cos(ang) * pull * 0.5);
        magnetPairs[i].yTo(-Math.sin(ang) * pull * 0.5);
      });
      lastMouse = null;
    };
    nameLine.addEventListener('mousemove', (e) => {
      if (!cachedRects) {
        cachedRects = chars.map((ch) => ch.getBoundingClientRect());
      }
      lastMouse = { x: e.clientX, y: e.clientY };
      requestAnimationFrame(applyChars);
    });
    nameLine.addEventListener('mouseleave', () => {
      magnetPairs.forEach((m) => { m.xTo(0); m.yTo(0); });
    });
  }

  /* ---------- THREE.JS: hero starfield (WebGL) ---------- */
  // Renders inside #heroCanvas — a fixed-size canvas that never moves
  // with the DOM, so scrolling costs zero per-frame JS on this scene.
  // GPU-composited, transform-only interactions (gsap-perf rules apply
  // to WebGL too: geometry count is small, points are static positions).
  function initThree() {
    if (prefersReduced || isCoarse) return; // skip on mobile/reduced — perf
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const hero = canvas.parentElement; // .hero
    if (!hero) return;

    // antialias: false — MSAA 4x is the single biggest WebGL GPU cost;
    // 0.03-sized points don't show aliasing, and the win is substantial.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap — 2x wastes GPU
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.z = 3.5;

    // Layered starfield: three shells at different radii rotate at
    // different speeds → parallax depth without any per-star work.
    // BufferGeometry, static — uploaded once, never mutated.
    const hue = 260; // accent violet, matches --accent
    const layers = [];
    [400, 250, 120].forEach((count, li) => {
      const radius = 2 + li * 1.3;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = radius + Math.random() * 0.8;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(ph) * Math.cos(th);
        positions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        positions[i * 3 + 2] = r * Math.cos(ph);
        const c = new THREE.Color().setHSL(hue / 360, 0.8, 0.5 + Math.random() * 0.45);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.03 * (li + 1), vertexColors: true, transparent: true,
        opacity: 0.85, sizeAttenuation: true
      });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      layers.push(pts);
    });

    // Shooting star: a short line that streaks across occasionally.
    const streakGeo = new THREE.BufferGeometry();
    const streakPos = new Float32Array(6); // 2 vertices × 3
    streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
    const streakMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const streak = new THREE.Line(streakGeo, streakMat);
    streak.frustumCulled = false;
    scene.add(streak);
    let streakTimer = 0;
    const streakAnim = (t, dt) => {
      streakTimer -= dt;
      if (streakTimer <= 0 && streakMat.opacity <= 0.01) {
        // Launch: random direction in the front hemisphere.
        const s = 1.6 + Math.random() * 1.2;
        const v = new THREE.Vector3(
          (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0.5 + Math.random() * 0.5
        ).normalize().multiplyScalar(s);
        streak.userData = { p: new THREE.Vector3(0, 0, 2), v, t: 0, dur: 0.8 + Math.random() * 0.6 };
        streakTimer = 4 + Math.random() * 6;
      }
      const d = streak.userData;
      if (d) {
        d.t += dt;
        d.p.addScaledVector(d.v, dt);
        // write the two vertices: head and tail (offset back along v)
        const head = d.p;
        const back = head.clone().sub(d.v.clone().multiplyScalar(0.3));
        const arr = streakGeo.attributes.position.array;
        arr[0] = head.x; arr[1] = head.y; arr[2] = head.z;
        arr[3] = back.x; arr[4] = back.y; arr[5] = back.z;
        streakGeo.attributes.position.needsUpdate = true;
        const k = d.t / d.dur;
        streakMat.opacity = k < 0.7 ? 0.9 : 0.9 * (1 - (k - 0.7) / 0.3);
        if (k >= 1) { streakMat.opacity = 0; delete streak.userData; }
      }
    };

    function size() {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener('resize', size, { passive: true });

    // Mouse-tilt camera (subtle) + slow ambient rotation.
    // Perf: only listen while the hero is visible — the listener is
    // removed when the render loop stops (hero off-screen).
    const target = { tx: 0, ty: 0 };
    function onMouseTilt(e) {
      target.tx = (e.clientX / window.innerWidth - 0.5) * 0.6;
      target.ty = (e.clientY / window.innerHeight - 0.5) * 0.4;
    }
    let last = performance.now();
    let running = true;
    let rafId = 0;
    // Pause rendering entirely when the hero is off-screen — the scene
    // is fixed inside #heroCanvas, so it only matters while visible.
    const heroObserver = new IntersectionObserver((entries) => {
      running = entries[0].isIntersecting;
      if (running) {
        last = performance.now(); // avoid a dt jump on resume
        if (!rafId) rafId = requestAnimationFrame(raf);
        window.addEventListener('mousemove', onMouseTilt, { passive: true });
      } else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        window.removeEventListener('mousemove', onMouseTilt);
      }
    }, { threshold: 0 });
    heroObserver.observe(hero);

    function raf(now) {
      rafId = 0;
      if (!running) return; // observer restarts the loop when visible again
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      layers.forEach((l, i) => {
        l.rotation.y += dt * (0.05 + i * 0.03); // parallax: outer shells spin faster
        l.rotation.x += dt * 0.008;
      });
      // Camera eases toward the mouse target (cheap lerp, transform-only).
      camera.position.x += (target.tx - camera.position.x) * 0.05;
      camera.position.y += (target.ty - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      streakAnim(now, dt);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
  }

  /* ---------- ANIME.JS: hero ticker (cycle + fade) ---------- */
  // Replaces the ScrambleTextPlugin interval: anime.js owns the whole
  // cycle — fade out, swap text, fade in, pause, repeat. One interval,
  // compositor-friendly opacity tweens only.
  function initAnimeTicker() {
    const ticker = document.getElementById('ticker');
    if (!ticker || typeof anime === 'undefined') return;
    const phrases = ['student', 'builder', 'problem-solver', 'lynbrook', 'class of 2027'];
    let p = 0;
    ticker.textContent = phrases[0];
    p = 1;
    anime({
      targets: ticker,
      opacity: [0.35, 1],
      duration: 600,
      easing: 'easeOutQuad'
    });
    const iv = setInterval(() => {
      anime({
        targets: ticker,
        opacity: 0.15,
        duration: 200,
        easing: 'easeInQuad',
        complete: () => {
          ticker.textContent = phrases[p % phrases.length];
          p++;
          anime({
            targets: ticker,
            opacity: 1,
            duration: 350,
            easing: 'easeOutQuad'
          });
        }
      });
    }, 2600);
    ticker._animeIv = iv; // cleanup hook (not used by app, free for tests)
  }

  /* ---------- SCROLLSPY (active nav link) ---------- */
  // Cached section bounds (refreshed on resize + after load) — no
  // offsetTop reads per scroll frame; scroll position comes from the
  // shared scrollState, one layout read total.
  function initScrollspy() {
    const sections = gsap.utils.toArray('section[id]');
    const links = gsap.utils.toArray('.nav__link');
    if (!sections.length || !links.length) return;
    const map = new Map();
    links.forEach((l) => map.set(l.getAttribute('href').slice(1), l));
    let bounds = [];
    const measure = () => { bounds = sections.map((s) => ({ id: s.id, top: s.offsetTop })); };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { passive: true });
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = scrollState.y + window.innerHeight * 0.35;
      let current = null;
      bounds.forEach((b) => { if (b.top <= y) current = b.id; });
      links.forEach((l) => l.classList.remove('is-active'));
      if (current && map.has(current)) map.get(current).classList.add('is-active');
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    // Lenis-driven scroll also updates the spy (rAF-throttled)
    const lenis = window.__lenis;
    if (lenis) lenis.on('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    });
    update();
  }

  /* ---------- TIMELINE PROGRESS RAIL ---------- */
  // A gradient rail grows down the first timeline column as you scroll
  // through the section — GSAP scrub, zero per-frame JS cost.
  function initTimelineProgress() {
    const timeline = document.getElementById('timeline');
    const items = gsap.utils.toArray('.timeline__item');
    if (!timeline || !items.length) return;
    const rail = document.createElement('div');
    rail.className = 'timeline__rail';
    rail.setAttribute('aria-hidden', 'true');
    timeline.appendChild(rail);
    gsap.fromTo(rail,
      { scaleY: 0 },
      {
        scaleY: 1, ease: 'none', transformOrigin: 'top center',
        scrollTrigger: {
          trigger: timeline,
          start: 'top 75%',
          end: 'bottom 60%',
          scrub: 0.4
        }
      }
    );
  }

  /* ---------- FLOATING ORBS (anime.js) ---------- */
  // Ambient gradient blobs drift slowly — infinite transform-only
  // tweens, GPU-composited, zero layout reads.
  function initOrbFloat() {
    if (prefersReduced || typeof anime === 'undefined') return;
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, i) => {
      anime({
        targets: orb,
        translateY: [{ value: 0 }, { value: -22 - i * 10, duration: 2600 + i * 600, easing: 'easeInOutSine' }, { value: 0, duration: 2600 + i * 600, easing: 'easeInOutSine' }],
        duration: 5200 + i * 1200, loop: true, delay: i * 800
      });
    });
  }

  /* ---------- TEXT CHOREOGRAPHY (word-by-word leads) ---------- */
  // SplitText word mask reveal on [data-choreo] paragraphs — play-once,
  // clearProps'ed, transform-only. The "premium editorial" motion.
  function initTextChoreography() {
    const els = gsap.utils.toArray('[data-choreo]');
    if (!els.length || typeof SplitText === 'undefined') return;
    els.forEach((el) => {
      const split = SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'choreo-word' });
      gsap.fromTo(split.words,
        { yPercent: 110 },
        { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: 'power4.out',
          clearProps: 'all',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true } }
      );
    });
  }

  /* ---------- GHOST NUMERAL PARALLAX ---------- */
  // Section numerals drift at a different speed than the section —
  // the cheap Framer-style depth trick. Scrub (animated every scroll
  // frame) but transform-only and only 6 elements, will-change set.
  function initGhostParallax() {
    const ghosts = gsap.utils.toArray('.section__ghost');
    if (!ghosts.length) return;
    ghosts.forEach((g) => {
      gsap.fromTo(g,
        { yPercent: -18 },
        { yPercent: 18, ease: 'none',
          scrollTrigger: {
            trigger: g.parentElement, start: 'top bottom', end: 'bottom top',
            scrub: 0.6
          } }
      );
    });
  }

  /* ---------- SKILL PILL HOVER FLOAT ---------- */
  // Infinite gentle bob on hover — anime.js owns the transform AFTER
  // GSAP's entrance (clearProps: 'all' hands it off cleanly).
  function initSkillFloat() {
    if (prefersReduced || typeof anime === 'undefined') return;
    document.querySelectorAll('.skill-pill').forEach((pill) => {
      let anim = null;
      pill.addEventListener('mouseenter', () => {
        if (anim) anim.pause();
        anim = anime({
          targets: pill,
          translateY: [{ value: 0 }, { value: -6, duration: 500, easing: 'easeInOutQuad' }, { value: 0, duration: 500, easing: 'easeInOutQuad' }],
          duration: 1000, loop: true, autoplay: true
        });
      });
      pill.addEventListener('mouseleave', () => {
        if (anim) { anim.pause(); anim.seek(0); }
      });
    });
  }

  /* ---------- SCRAMBLE HOVER (anime.js) ---------- */
  // Nav links + footer links decode a shuffled version of their own
  // text on hover — cheap: only runs during hover, never on scroll.
  function initScrambleHover() {
    if (prefersReduced || typeof anime === 'undefined') return;
    document.querySelectorAll('.nav__link, .footer__link').forEach((el) => {
      const original = el.textContent;
      if (original.length < 2) return;
      let active = null;
      el.addEventListener('mouseenter', () => {
        if (active) active.pause();
        // Scramble frames: shuffled charset, converges to the original.
        const frames = 6;
        active = anime({
          targets: el,
          textContent: [0, 1],
          duration: 450,
          easing: 'easeOutQuad',
          update: (a) => {
            const t = a.progress / 100; // 0..1
            const done = Math.floor(t * original.length);
            let out = '';
            for (let i = 0; i < original.length; i++) {
              out += i < done ? original[i] : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 52)];
            }
            el.textContent = out;
          },
          complete: () => { el.textContent = original; }
        });
      });
      el.addEventListener('mouseleave', () => {
        if (active) { active.pause(); el.textContent = original; }
      });
    });
  }

  /* ---------- CARD SHINE SWEEP ---------- */
  // One ::after gradient sweep per card on hover — compositor-friendly
  // (translateX only), fires only on hover.
  function initCardShine() {
    if (prefersReduced || typeof anime === 'undefined') return;
    document.querySelectorAll('.project-card, .card').forEach((card) => {
      const shine = document.createElement('span');
      shine.className = 'card-shine';
      shine.setAttribute('aria-hidden', 'true');
      card.appendChild(shine);
      let anim = null;
      card.addEventListener('mouseenter', () => {
        if (anim) anim.pause();
        anim = anime({
          targets: shine,
          translateX: ['-120%', '120%'],
          duration: 700,
          easing: 'easeInOutQuad'
        });
      });
      card.addEventListener('mouseleave', () => {
        if (anim) { anim.pause(); anim.seek(0); }
      });
    });
  }

  /* ---------- HERO MOUSE PARALLAX ---------- */
  // Content shifts a few px toward the cursor — quickTo, compositor.
  function initHeroMouseParallax() {
    if (prefersReduced || isCoarse) return;
    const grid = document.querySelector('.hero__grid');
    if (!grid) return;
    const xTo = gsap.quickTo(grid, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(grid, 'y', { duration: 0.5, ease: 'power3' });
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 20; // ±10px
      const ny = (e.clientY / window.innerHeight - 0.5) * 14; // ±7px
      xTo(nx); yTo(ny);
    }, { passive: true });
  }

  /* ---------- BOOT ---------- */
  function boot(hasGsap) {
    initTheme();
    initMagnetic();
    initCounters();
    initFallbackReveals(hasGsap);
    initTilt();
    initSpotlights();
    initThree();
    initAnimeTicker();
    initOrbFloat();
    initSkillFloat();
    initScrambleHover();
    initCardShine();
    initHeroMouseParallax();
    onScrollNav();
    // Lenis is the single scroll source; native scroll listener removed —
    // its redundant layout reads were the per-frame jank. Listeners that
    // must fire even without Lenis subscribe to Lenis' scroll event.
    const lenis = window.__lenis;
    if (lenis) {
      lenis.on('scroll', (e) => {
        updateScrollState(); onScrollNav();
        // Ambient audio: pitch the bed with scroll speed (no-op if off).
        if (window.__audioScroll) window.__audioScroll(e.velocity || 0);
      });
    } else {
      window.addEventListener('scroll', () => { updateScrollState(); onScrollNav(); }, { passive: true });
    }
    hidePreloader();
  }

  /* ---------- GSAP PATH ---------- */
  function initGsap() {
    if (typeof gsap === 'undefined') { boot(false); return; }
    if (typeof ScrollTrigger === 'undefined' && typeof window.ScrollTrigger === 'undefined') { boot(false); return; }
    if (typeof SplitText !== 'undefined' || typeof window.SplitText !== 'undefined') {
      gsap.registerPlugin(typeof SplitText !== 'undefined' ? SplitText : window.SplitText);
    }
    const ScrollTriggerLib = typeof ScrollTrigger !== 'undefined' ? ScrollTrigger : window.ScrollTrigger;
    gsap.registerPlugin(ScrollTriggerLib);

    boot(true);

    if (prefersReduced) {
      // Reduced motion: show everything in final state, no animation.
      gsap.set('.reveal', { opacity: 1, y: 0 });
      gsap.set('.hero__line', { opacity: 1, y: 0 });
      gsap.set('.hero__name-char', { opacity: 1 });
      // Static-first features still work without motion
      initScrollspy();
      initTimelineProgress();
      return;
    }
      // Hero bg parallax — replaced by the three.js starfield (a GSAP scrub
      // on the DOM here meant per-frame layout; the WebGL scene is a fixed
      // canvas, so scrolling touches nothing).

      // Hero content entrance — SplitText char reveal on the name.
      // autoSplit: re-splits if fonts finish loading late, avoiding wrong
      // line breaks (gsap-plugins); CSS .hero__name-char { opacity: 0 }
      // is the FOUC-safe hidden state, removed on completion.
      gsap.fromTo('.hero__eyebrow', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out', overwrite: 'auto', clearProps: 'all' });
      gsap.fromTo('.hero__line:not(.hero__line--name)',
        { y: 80, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1, stagger: 0.12, delay: 0.35, ease: 'power4.out', clearProps: 'all' }
      );
      // Section titles — springy Framer-style pop. clearProps: tween
      // ends at natural state so no finished animation pins a GPU layer
      // (the #1 hidden scroll-jank source on reveal-heavy sites).
      gsap.utils.toArray('.section__title').forEach((title) => {
        gsap.fromTo(title,
          { y: 50, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(1.4)',
            clearProps: 'all',
            scrollTrigger: { trigger: title, start: 'top 85%', once: true } }
        );
      });

      // Generic reveal elements
      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.fromTo(el,
          { y: 60, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out',
            clearProps: 'all',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true } }
        );
      });

      // Hero CTA + stats (subtitle handled above) — clearProps drops
      // the layers once the entrance finishes (hero sits at scroll 0,
      // but layers here still cost the compositor on every scroll pass).
      gsap.fromTo('.hero__subtitle', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.8, ease: 'power3.out', overwrite: 'auto', clearProps: 'all' });
      gsap.fromTo('.hero__cta .btn', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, delay: 0.95, ease: 'power3.out', overwrite: 'auto', clearProps: 'all' });
      gsap.fromTo('.hero__stats', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 1.1, ease: 'power3.out', overwrite: 'auto', clearProps: 'all' });
      gsap.fromTo('.hero__scroll-hint', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 1.6, overwrite: 'auto', clearProps: 'all' });

      // SplitText name reveal (after generic reveals so it wins the
      // name chars; GSAP 3.13+ free plugin, no membership needed)
      const nameLine = document.querySelector('.hero__line--name');
      if (nameLine && typeof SplitText !== 'undefined') {
        gsap.registerPlugin(SplitText);
        // role="text" makes aria-label valid on the span (aria-prohibited-attr)
        nameLine.setAttribute('role', 'text');
        SplitText.create(nameLine, {
          type: 'chars',
          mask: 'chars',
          charsClass: 'hero__name-char',
          autoSplit: true,
          onSplit(self) {
            // Staggered mask reveal per char, scrub-safe
            const tween = gsap.fromTo(self.chars,
              { yPercent: 110, autoAlpha: 0 },
              { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.04, delay: 0.35, ease: 'power4.out' }
            );
            // Return the animation so SplitText syncs/reverts it on re-split
            return tween;
          }
        });
      }
      // After split, make the name chars magnetically reactive (unique interaction)
      initMagneticChars();

      // Hero phrase ticker — anime.js cycles the phrase with a fade
      // (initAnimeTicker, boot path). No ScrambleTextPlugin dependency.

      // Scrollspy + timeline rail (unique progress feel)
      initScrollspy();
      initTimelineProgress();
      initGhostParallax();
      initTextChoreography();

      // Timeline: pinned scrub with stagger
      const timeline = document.getElementById('timeline');
      const items = gsap.utils.toArray('.timeline__item');
      if (timeline && items.length) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: timeline,
            start: 'top 70%',
            // play once, stay played — reversing re-applies the x-offset
            // (overflow on mobile) and re-hides content when scrolling back up
            toggleActions: 'play none none none'
          }
        });
        items.forEach((item, i) => {
          tl.fromTo(item,
            { x: i % 2 ? 80 : -80, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', clearProps: 'all' },
            i * 0.15
          );
        });
      }

      // Skill pills stagger — clearProps frees the pill for anime's
      // hover float (initSkillFloat) without transform conflicts.
      gsap.fromTo('.skill-pill',
        { scale: 0.6, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: 'back.out(1.7)',
          clearProps: 'all',
          scrollTrigger: { trigger: '.skills__cloud', start: 'top 85%', once: true } }
      );

      // Nav entrance
      gsap.fromTo('.nav__inner', { y: -20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, delay: 0.3, ease: 'power3.out', clearProps: 'all' });

      ScrollTriggerLib.refresh();
  }

  /* ---------- LENIS ---------- */
  function initLenis() {
    if (prefersReduced) return;
    if (typeof Lenis === 'undefined' && typeof window.Lenis === 'undefined') return;
    const LenisLib = typeof Lenis !== 'undefined' ? Lenis : window.Lenis;
    try {
      const lenis = new LenisLib({
        duration: 0.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5
      });

      // Drive Lenis with its own rAF loop. Perf: the loop stops when
      // Lenis is idle (no velocity) — an idle page costs zero rAF ticks
      // instead of 60fps of spring math. Restart on any interaction.
      let rafId = 0;
      let idleFrames = 0;
      function raf(time) {
        rafId = 0;
        lenis.raf(time);
        idleFrames = lenis.velocity === 0 ? idleFrames + 1 : 0;
        if (idleFrames < 3) rafId = requestAnimationFrame(raf);
      }
      const startLoop = () => { idleFrames = 0; if (!rafId) rafId = requestAnimationFrame(raf); };
      startLoop();
      window.addEventListener('wheel', startLoop, { passive: true });
      window.addEventListener('touchstart', startLoop, { passive: true });

      // Anchor links use Lenis
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
          const target = document.querySelector(a.getAttribute('href'));
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -72 });
        });
      });

      window.__lenis = lenis;
    } catch (err) { /* Lenis failed — native scroll is fine */ }
  }

  /* ---------- ENTRY ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    // Smooth-scroll sites must start at the top; otherwise a restored
    // scroll position kills all `once: true` reveals before they fire.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (window.scrollY > 0) window.scrollTo(0, 0);
    initLenis();
    initGsap();

    // Lenis and ScrollTrigger talk to each other: Lenis emits scroll
    // events, ScrollTrigger must update from them.
    const lenis = window.__lenis;
    if (lenis && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
    // Recompute trigger positions once everything (fonts, images) is in.
    window.addEventListener('load', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });

  // Ensure preloader never traps the page
  setTimeout(hidePreloader, 4000);
})();
