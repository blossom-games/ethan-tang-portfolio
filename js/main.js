/* ============================================
   ETHAN TANG — PORTFOLIO JS
   Lenis smooth scroll + GSAP ScrollTrigger
   ============================================ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;

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

  /* ---------- SCROLL PROGRESS (no lib needed) ---------- */
  const progressBar = document.getElementById('scrollProgress');
  function onScrollProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? h.scrollTop / max : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${p})`;
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

  /* ---------- SCROLLSPY (active nav link) ---------- */
  function initScrollspy() {
    const sections = gsap.utils.toArray('section[id]');
    const links = gsap.utils.toArray('.nav__link');
    if (!sections.length || !links.length) return;
    const map = new Map();
    links.forEach((l) => map.set(l.getAttribute('href').slice(1), l));
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY + window.innerHeight * 0.35;
      let current = null;
      sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
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

  /* ---------- BOOT ---------- */
  function boot(hasGsap) {
    initTheme();
    initMagnetic();
    initCounters();
    initFallbackReveals(hasGsap);
    initTilt();
    initSpotlights();
    onScrollNav();
    onScrollProgress();
    window.addEventListener('scroll', () => { onScrollNav(); onScrollProgress(); }, { passive: true });
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
      // Hero bg parallax — desktop only; scrub on low-end mobile adds jank
      const heroBg = document.getElementById('heroBg');
      if (heroBg && !isCoarse) {
        gsap.to(heroBg, {
          yPercent: 25,
          ease: 'none',
          scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: 0.6 }
        });
      }

      // Hero content entrance — SplitText char reveal on the name.
      // autoSplit: re-splits if fonts finish loading late, avoiding wrong
      // line breaks (gsap-plugins); CSS .hero__name-char { opacity: 0 }
      // is the FOUC-safe hidden state, removed on completion.
      gsap.fromTo('.hero__eyebrow', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out', overwrite: 'auto' });
      gsap.fromTo('.hero__line:not(.hero__line--name)',
        { y: 80, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1, stagger: 0.12, delay: 0.35, ease: 'power4.out' }
      );
      // Section titles — fromTo so once:true kill preserves final state
      gsap.utils.toArray('.section__title').forEach((title) => {
        gsap.fromTo(title,
          { y: 50, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: title, start: 'top 85%', once: true } }
        );
      });

      // Generic reveal elements
      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.fromTo(el,
          { y: 60, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true } }
        );
      });

      // Hero CTA + stats (subtitle handled above)
      gsap.fromTo('.hero__subtitle', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.8, ease: 'power3.out', overwrite: 'auto' });
      gsap.fromTo('.hero__cta .btn', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, delay: 0.95, ease: 'power3.out', overwrite: 'auto' });
      gsap.fromTo('.hero__stats', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 1.1, ease: 'power3.out', overwrite: 'auto' });
      gsap.fromTo('.hero__scroll-hint', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 1.6, overwrite: 'auto' });

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

      // Hero phrase ticker — scramble-decodes on interval (unique signature)
      const ticker = document.getElementById('ticker');
      if (ticker && typeof ScrambleTextPlugin !== 'undefined') {
        gsap.registerPlugin(ScrambleTextPlugin);
        const phrases = ['student', 'builder', 'problem-solver', 'lynbrook', 'class of 2027'];
        let p = 0;
        const next = () => {
          ticker.textContent = phrases[p % phrases.length];
          gsap.fromTo(ticker, { opacity: 0.35 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
          p++;
        };
        next();
        setInterval(() => {
          gsap.to(ticker, {
            opacity: 0.15, duration: 0.2, ease: 'power1.in',
            onComplete() {
              ticker.textContent = phrases[p % phrases.length];
              gsap.to(ticker, { opacity: 1, duration: 0.35, ease: 'power2.out' });
              p++;
            }
          });
        }, 2600);
      }

      // Scrollspy + timeline rail (unique progress feel)
      initScrollspy();
      initTimelineProgress();

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
            { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' },
            i * 0.15
          );
        });
      }

      // Skill pills stagger
      gsap.fromTo('.skill-pill',
        { scale: 0.6, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: '.skills__cloud', start: 'top 85%', once: true } }
      );

      // Nav entrance
      gsap.fromTo('.nav__inner', { y: -20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, delay: 0.3, ease: 'power3.out' });

      ScrollTriggerLib.refresh();
  }

  /* ---------- LENIS ---------- */
  function initLenis() {
    if (prefersReduced) return;
    if (typeof Lenis === 'undefined' && typeof window.Lenis === 'undefined') return;
    const LenisLib = typeof Lenis !== 'undefined' ? Lenis : window.Lenis;
    try {
      const lenis = new LenisLib({
        duration: 0.9,
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
