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
    const ringXTo = gsap.quickTo(cursorRing, 'x', { duration: 0.3, ease: 'power3' });
    const ringYTo = gsap.quickTo(cursorRing, 'y', { duration: 0.3, ease: 'power3' });
    // Glow lags the ring slightly for depth.
    const glowXTo = cursorGlow ? gsap.quickTo(cursorGlow, 'x', { duration: 0.55, ease: 'power3' }) : null;
    const glowYTo = cursorGlow ? gsap.quickTo(cursorGlow, 'y', { duration: 0.55, ease: 'power3' }) : null;

    window.addEventListener('mousemove', (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      cursor.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      ringXTo(e.clientX);
      ringYTo(e.clientY);
      if (glowXTo && glowYTo) { glowXTo(e.clientX); glowYTo(e.clientY); }
    }, { passive: true });

    document.querySelectorAll('a, button, .project-card, .skill-pill').forEach((el) => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-active'));
    });
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  function initMagnetic() {
    if (prefersReduced) return;
    document.querySelectorAll('.magnetic').forEach((el) => {
      const strength = 0.35;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('mouseleave', () => {
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
  function initTilt() {
    if (prefersReduced || isCoarse) return;
    document.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
      });
    });
  }

  /* ---------- CARD SPOTLIGHT (cursor-tracking glow) ---------- */
  function initSpotlights() {
    if (isCoarse) return;
    document.querySelectorAll('.card, .project-card').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
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
    nameLine.addEventListener('mousemove', (e) => {
      const r = nameLine.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      chars.forEach((ch, i) => {
        const cr = ch.getBoundingClientRect();
        const dx = e.clientX - (cr.left + cr.width / 2);
        const dy = e.clientY - (cr.top + cr.height / 2);
        const d = Math.hypot(dx, dy);
        const pull = d < 90 ? (1 - d / 90) * strength : 0;
        const ang = Math.atan2(dy, dx);
        // Push the char gently AWAY from the cursor; restore to base.
        magnetPairs[i].xTo(-Math.cos(ang) * pull * 0.5);
        magnetPairs[i].yTo(-Math.sin(ang) * pull * 0.5);
      });
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

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap — 2x wastes GPU
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.z = 3.5;

    // Points cloud: 400 stars. BufferGeometry, static — uploaded once.
    const count = 400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const hue = 260; // accent violet, matches --accent
    for (let i = 0; i < count; i++) {
      const r = 1.4 + Math.random() * 3.6;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(ph) * Math.cos(th);
      positions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      positions[i * 3 + 2] = r * Math.cos(ph);
      const c = new THREE.Color().setHSL(hue / 360, 0.8, 0.55 + Math.random() * 0.4);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.03, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    function size() {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener('resize', size, { passive: true });

    // Slow ambient rotation — the only per-frame work. Cheap (one matrix).
    let last = performance.now();
    function raf(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      stars.rotation.y += dt * 0.05;
      stars.rotation.x += dt * 0.008;
      renderer.render(scene, camera);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
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
      lenis.on('scroll', () => { updateScrollState(); onScrollNav(); });
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

      // Drive Lenis with its own rAF loop — always running, even when
      // GSAP has no active tweens (otherwise scrollTo never animates).
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);

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
