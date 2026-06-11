/**
 * Rohan Kapoor — Site 2
 * GSAP · ScrollTrigger · Lenis
 */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const mqMobile = window.matchMedia('(max-width: 767px)');
  const mqTouch = window.matchMedia('(hover: none), (pointer: coarse)');
  const mqDesktop = window.matchMedia('(min-width: 1200px)');

  const ENV = {
    prefersReduced,
    hasGsap,
    isMobile: () => mqMobile.matches,
    isTouch: () => mqTouch.matches,
    isDesktop: () => mqDesktop.matches,
    canPin: () => hasGsap && !prefersReduced && !mqMobile.matches,
  };

  const isMobile = ENV.isMobile;
  const isTouch = ENV.isTouch;
  const isDesktop = ENV.isDesktop;

  let lenis = null;
  let pendingHash = window.location.hash;

  /* ── Utilities ── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function sizedSrc(base, size) {
    if (!base) return base;
    if (base.includes('stakes-bg')) {
      return size === 'sm' ? 'images/stakes-bg.webp' : (size === 'md' ? 'images/stakes-bg-md.webp' : base);
    }
    if (base.includes('rohan-portrait')) {
      return size === 'sm' ? 'images/rohan-portrait-sm.jpg' : base;
    }
    const sized = base.replace('.webp', `-${size}.webp`);
    return sized;
  }

  function pickImageSrc(base) {
    if (!base) return base;
    if (isMobile()) return sizedSrc(base, 'sm');
    if (isDesktop()) return base;
    return sizedSrc(base, 'md');
  }

  function waitForImages(urls) {
    return Promise.all(urls.map((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = src;
    })));
  }

  /* ══════════════════════════════════════════
     TEXT EFFECTS — word/line reveals + highlights
     ══════════════════════════════════════════ */
  function initTextEffects() {
    if (!hasGsap || prefersReduced) {
      qsa('.tx-hl[data-hl]').forEach((el) => el.classList.add('is-lit'));
      qsa('.eyebrow').forEach((el) => el.classList.add('is-drawn'));
      return;
    }

    qsa('.eyebrow').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => el.classList.add('is-drawn'),
      });
      const line = el.querySelector('.eyebrow__line');
      if (line) {
        gsap.from(line, {
          width: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        });
      }
    });
  }

  function revealWords(container, opts = {}) {
    if (!container || !hasGsap) return;
    const words = qsa('.tx-word', container);
    const lines = qsa('.tx-line', container);
    const targets = words.length ? words : qsa('[data-split="words"] > *', container);

    if (words.length) {
      gsap.set(words, { y: '110%', opacity: 0 });
      gsap.to(words, {
        y: '0%',
        opacity: 1,
        duration: opts.duration || 0.75,
        stagger: opts.stagger || 0.04,
        ease: opts.ease || 'power3.out',
        delay: opts.delay || 0,
        scrollTrigger: opts.scrollTrigger,
      });
    }

    if (lines.length && opts.lineStagger) {
      gsap.set(lines, { y: '100%', opacity: 0 });
      gsap.to(lines, {
        y: '0%',
        opacity: 1,
        duration: 0.9,
        stagger: 0.14,
        ease: 'power3.out',
        delay: opts.delay || 0,
        scrollTrigger: opts.scrollTrigger,
      });
    }
  }

  function scrubHighlights(section, trigger) {
    if (!section || !hasGsap) return;
    const highlights = qsa('.tx-hl[data-hl]', section);
    if (!highlights.length) return;

    highlights.forEach((hl, i) => {
      ScrollTrigger.create({
        trigger: trigger || section,
        start: () => `top+=${i * 8}% center`,
        end: () => `top+=${(i + 1) * 12}% center`,
        onEnter: () => hl.classList.add('is-lit'),
        onLeaveBack: () => hl.classList.remove('is-lit'),
      });
    });
  }

  /* ══════════════════════════════════════════
     PRELOADER — cinematic handoff
     ══════════════════════════════════════════ */
  function initPreloader(onDone) {
    const el = qs('#preloader');
    if (!el) { onDone(); return; }

    let finished = false;
    const complete = () => {
      if (finished) return;
      finished = true;
      el.classList.add('is-done');
      try { localStorage.setItem('hasSeenIntro', '1'); } catch (_) { /* private mode */ }
      onDone();
    };

    const skipBtn = qs('#preloader-skip', el);
    const hasSeenIntro = (() => {
      try { return localStorage.getItem('hasSeenIntro') === '1'; } catch (_) { return false; }
    })();

    const quickExit = () => {
      if (finished) return;
      if (hasGsap && !prefersReduced) {
        gsap.to(el, {
          opacity: 0,
          duration: prefersReduced ? 0.2 : 0.45,
          ease: 'power2.inOut',
          onComplete: complete,
        });
      } else {
        complete();
      }
    };

    skipBtn?.addEventListener('click', quickExit);

    if (!hasGsap || prefersReduced || hasSeenIntro) {
      quickExit();
      return;
    }

    const letters = qsa('.preloader__brand span:not(.preloader__space)', el);
    const tag = qs('.preloader__tag', el);
    const bar = qs('.preloader__bar-fill', el);
    const pct = qs('#preloader-pct', el);
    const preview = qs('.preloader__preview', el);
    const frames = qsa('.preloader__frame', el);
    const counter = { val: 0 };

    const runIntro = () => {
      if (finished) return;
      const tl = gsap.timeline({
        onComplete: () => {
          if (finished) return;
          const out = gsap.timeline({ onComplete: complete });
          out.to(preview, { scale: 1.35, opacity: 0, duration: 0.9, ease: 'power2.inOut' })
            .to(el, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, '-=0.4')
            .to(frames, { opacity: 0, duration: 0.3 }, '-=0.55');
        },
      });

      tl.set(preview, { opacity: 0, scale: 1.15 })
        .to(frames, { opacity: 1, duration: 0.75, stagger: 0.07, ease: 'power2.out' })
        .to(preview, { opacity: 0.38, scale: 1.04, filter: 'blur(0px)', duration: 1.3, ease: 'power2.out' }, '-=0.45')
        .to(letters, { opacity: 1, y: 0, duration: 0.5, stagger: 0.035, ease: 'power3.out' }, '-=0.95')
        .to(tag, { opacity: 1, duration: 0.4 }, '-=0.55')
        .to(pct, { opacity: 1, duration: 0.3 }, '-=0.25')
        .to(counter, {
          val: 100,
          duration: 1.5,
          ease: 'power1.inOut',
          onUpdate: () => {
            const n = Math.round(counter.val);
            if (pct) pct.textContent = n;
            if (bar) bar.style.width = n + '%';
          },
        }, '-=0.15');
    };

    const preloadUrls = isMobile()
      ? ['images/B2-sm.webp', 'images/stakes-bg.webp']
      : ['images/B2-md.webp', 'images/stakes-bg-md.webp'];
    const maxWait = isMobile() ? 3200 : 5500;
    const safetyTimer = setTimeout(quickExit, maxWait);

    waitForImages(preloadUrls)
      .then(() => {
        clearTimeout(safetyTimer);
        if (!finished) gsap.delayedCall(0.15, runIntro);
      })
      .catch(() => {
        clearTimeout(safetyTimer);
        if (!finished) gsap.delayedCall(0.15, runIntro);
      });
  }

  /* ══════════════════════════════════════════
     LENIS + SCROLL PROGRESS
     ══════════════════════════════════════════ */
  function initLenis() {
    if (prefersReduced || typeof Lenis === 'undefined' || isMobile()) return null;

    const instance = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1,
    });

    instance.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      instance.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return instance;
  }

  function initScrollProgress() {
    const fill = qs('.scroll-progress__fill');
    if (!fill) return;
    fill.style.width = '0%';

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      fill.style.width = pct + '%';
    };

    if (hasGsap && !prefersReduced) {
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          fill.style.width = (self.progress * 100) + '%';
        },
      });
    } else {
      window.addEventListener('scroll', update, { passive: true });
      update();
    }
  }

  /* ══════════════════════════════════════════
     NAV — glass, hide on scroll, active links
     ══════════════════════════════════════════ */
  function initNav() {
    const nav = qs('#nav');
    const burger = qs('.nav__burger');
    const drawer = qs('#drawer');
    const shade = qs('.drawer__shade');
    const links = qsa('.nav__links a, .drawer__panel a');

    if (!nav) return;

    let lastY = 0;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-glass', y > 60);

      if (window.matchMedia('(min-width: 900px)').matches) {
        nav.classList.toggle('nav--hidden', y > 120 && y > lastY);
      }
      lastY = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Active section highlight */
    const sections = [
      { id: '#stakes', link: 'Story' },
      { id: '#chapters', link: 'The Day' },
      { id: '#family', link: 'Family' },
      { id: '#booking', link: 'Book' },
    ];

    if (hasGsap && !prefersReduced) {
      sections.forEach(({ id }) => {
        const target = qs(id);
        if (!target) return;
        ScrollTrigger.create({
          trigger: target,
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => {
            if (!self.isActive) return;
            const label = sections.find((s) => s.id === id)?.link;
            qsa('.nav__links a').forEach((a) => {
              a.classList.toggle('is-active', a.textContent.trim() === label);
            });
          },
        });
      });
    }

    const drawerLinks = qsa('.drawer__panel a');
    let drawerOpen = false;

    function trapDrawerFocus(e) {
      if (!drawerOpen || e.key !== 'Tab') return;
      const focusables = drawerLinks.filter((a) => !a.hasAttribute('disabled'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function openDrawer() {
      drawer?.classList.add('is-open');
      drawer?.setAttribute('aria-hidden', 'false');
      burger?.setAttribute('aria-expanded', 'true');
      burger?.setAttribute('aria-label', 'Close menu');
      document.body.style.overflow = 'hidden';
      drawerOpen = true;
      drawerLinks[0]?.focus();
    }

    function closeDrawer() {
      if (!drawerOpen) return;
      drawer?.classList.remove('is-open');
      drawer?.setAttribute('aria-hidden', 'true');
      burger?.setAttribute('aria-expanded', 'false');
      burger?.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
      drawerOpen = false;
      burger?.focus();
    }

    burger?.addEventListener('click', () => {
      drawerOpen ? closeDrawer() : openDrawer();
    });
    shade?.addEventListener('click', closeDrawer);
    drawerLinks.forEach((a) => a.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', (e) => {
      if (!drawerOpen) return;
      if (e.key === 'Escape') closeDrawer();
      trapDrawerFocus(e);
    });

    /* Smooth anchor scroll */
    qsa('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const target = qs(href);
        if (!target) return;
        e.preventDefault();
        closeDrawer();

        const offset = nav.offsetHeight + 8;
        if (lenis) {
          lenis.scrollTo(target, { offset: -offset, duration: prefersReduced ? 0 : 1.2 });
        } else {
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     HERO — mask reveal + parallax + entrance
     ══════════════════════════════════════════ */
  function initHero() {
    const media = qs('.hero__media');
    const eyebrow = qs('.hero__eyebrow');
    const title = qs('.hero__title');
    const sub = qs('.hero__sub');
    const actions = qs('.hero__actions');
    const scrollHint = qs('.hero__scroll');

    if (!hasGsap || prefersReduced) {
      gsap?.set([eyebrow, title, sub, actions, scrollHint].filter(Boolean), { opacity: 1 });
      if (media) media.style.clipPath = 'none';
      return;
    }

    /* Mask reveal — B2 blooms from center (desktop); full-bleed fade on mobile */
    const mobileHero = isMobile();
    if (mobileHero) {
      gsap.set(media, { clipPath: 'inset(0)', opacity: 0 });
      gsap.to(media, { opacity: 1, duration: 1.2, ease: 'power2.inOut', delay: 0.1 });
    } else {
      gsap.to(media, {
        clipPath: 'circle(150% at 50% 52%)',
        duration: 1.8,
        ease: 'power3.inOut',
        delay: 0.15,
      });
    }

    if (!isMobile()) {
      gsap.to(media, {
        y: '12%',
        scale: 1.06,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    gsap.set([eyebrow, sub, actions, scrollHint], { y: 28, opacity: 0 });

    const heroTl = gsap.timeline({ delay: 1.05, defaults: { ease: 'power3.out' } });
    heroTl.to(eyebrow, { opacity: 1, y: 0, duration: 0.65 })
      .add(() => eyebrow?.classList.add('is-drawn'), '-=0.4');

    const heroWords = qsa('.tx-word', title);
    const heroLines = qsa('.tx-line', title);
    if (heroLines.length) {
      gsap.set(heroLines, { y: '108%', opacity: 0 });
      heroTl.to(heroLines, { y: '0%', opacity: 1, duration: 0.95, stagger: 0.16 }, '-=0.2');
    }
    if (heroWords.length) {
      gsap.set(heroWords, { y: '110%', opacity: 0 });
      heroTl.to(heroWords, { y: '0%', opacity: 1, duration: 0.7, stagger: 0.035 }, '-=0.75');
    }
    heroTl
      .add(() => {
        qsa('.hero__title .tx-hl').forEach((hl, i) => {
          gsap.delayedCall(i * 0.07, () => hl.classList.add('is-lit'));
        });
      }, '-=0.35')
      .to(sub, { opacity: 1, y: 0, duration: 0.65 }, '-=0.35')
      .to(actions, { opacity: 1, y: 0, duration: 0.55 }, '-=0.4')
      .to(scrollHint, { opacity: 1, duration: 0.45 }, '-=0.2');

    gsap.to('.hero__scroll-line', {
      scaleY: 0.4,
      transformOrigin: 'top',
      repeat: -1,
      yoyo: true,
      duration: 1.6,
      ease: 'sine.inOut',
    });
  }

  /* ══════════════════════════════════════════
     STAKES — pinned parallax + word theatre
     ══════════════════════════════════════════ */
  function initStakes() {
    if (!hasGsap || prefersReduced) {
      qsa('.stakes .tx-hl[data-hl]').forEach((el) => el.classList.add('is-lit'));
      return;
    }

    const section = qs('.stakes');
    const bg = qs('.stakes__bg');
    const inner = qs('.stakes__inner');
    const title = qs('.stakes__title', section);
    if (!section || !bg) return;

    const mobile = isMobile();
    const stakesEnd = mobile ? '+=55%' : '+=120%';

    if (mobile) {
      gsap.fromTo(bg, { scale: 1.08 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        },
      });
      qsa('.stakes .tx-hl[data-hl]').forEach((hl) => {
        ScrollTrigger.create({
          trigger: hl,
          start: 'top 88%',
          onEnter: () => hl.classList.add('is-lit'),
        });
      });
    } else {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: stakesEnd,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });

      gsap.to(bg, {
        scale: 1.14,
        y: '10%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: stakesEnd,
          scrub: 1.2,
        },
      });
    }

    const titleWords = qsa('.tx-word', title);
    gsap.set(titleWords, { y: '115%', opacity: 0 });
    gsap.to(titleWords, {
      y: '0%',
      opacity: 1,
      stagger: 0.05,
      duration: 0.85,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    if (!mobile) {
      const stakesTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: stakesEnd,
          scrub: 0.8,
        },
      });

      qsa('.stakes .tx-hl[data-hl]').forEach((hl, i) => {
        stakesTl.call(() => hl.classList.add('is-lit'), null, i * 0.12);
      });
    }

    gsap.from(qs('.stakes__highlight', section), {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 60%', toggleActions: 'play none none reverse' },
    });

    gsap.from(qsa('.stakes__body, .stakes__aside', section), {
      opacity: 0,
      y: 24,
      stagger: 0.12,
      duration: 0.75,
      ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 52%', toggleActions: 'play none none reverse' },
    });

    if (!mobile) scrubHighlights(inner, section);
  }

  /* ══════════════════════════════════════════
     PROMISE — 4-slide pin scrub
     ══════════════════════════════════════════ */
  function initPromise() {
    if (!hasGsap || prefersReduced) {
      qsa('.promise__slide').forEach((s, i) => {
        s.style.opacity = i === 0 ? '1' : '0';
        s.style.visibility = i === 0 ? 'visible' : 'hidden';
      });
      return;
    }

    const pin = qs('#promise-pin');
    const slides = qsa('.promise__slide');
    const progressFill = qs('.promise__progress-fill');
    if (!pin || slides.length < 2) return;

    const mobile = isMobile();
    const slideFactor = mobile ? 0.55 : 1;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => '+=' + (window.innerHeight * slides.length * slideFactor),
        pin: !mobile,
        scrub: mobile ? 0.4 : 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (progressFill) progressFill.style.width = (self.progress * 100) + '%';
        },
      },
    });

    slides.forEach((slide, i) => {
      if (i === 0) return;
      const prev = slides[i - 1];
      const line = qs('.promise__line', slide);
      const eyebrow = qs('.promise__eyebrow', slide);

      tl.to(prev, { opacity: 0, duration: 0.35, ease: 'power2.inOut' })
        .set(prev, { visibility: 'hidden' })
        .set(slide, { visibility: 'visible' })
        .fromTo(slide, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.inOut' })
        .fromTo(eyebrow, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.15');

      const words = qsa('.tx-word', line);
      const plain = line && !words.length ? [line] : [];
      if (words.length) {
        tl.fromTo(words, { y: '100%', opacity: 0 }, { y: '0%', opacity: 1, stagger: 0.045, duration: 0.55, ease: 'power3.out' }, '-=0.25');
        qsa('.tx-hl', line).forEach((hl) => tl.call(() => hl.classList.add('is-lit'), null, '-=0.1'));
      } else if (plain.length) {
        tl.fromTo(plain, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.15');
      }

      const bg = qs('.promise__bg', slide);
      if (bg) {
        tl.fromTo(bg, { scale: 1.08 }, { scale: 1, duration: 0.6, ease: 'power2.out' }, '-=0.5');
      }
    });
  }

  /* ══════════════════════════════════════════
     GROOM — horizontal scroll chapter
     ══════════════════════════════════════════ */
  function initGroomScroll() {
    if (!hasGsap || prefersReduced) return;

    const section = qs('.groom-scroll');
    const track = qs('#groom-track');
    const panels = qsa('.groom-scroll__panel');
    if (!track || panels.length < 2) return;

    if (isMobile()) {
      section?.classList.add('groom-scroll--stack');
      panels.forEach((panel) => {
        const copy = qs('.groom-scroll__copy', panel);
        if (!copy) return;
        gsap.from(copy.children, {
          opacity: 0,
          y: 24,
          stagger: 0.08,
          duration: 0.65,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: panel,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        });
      });
      return;
    }

    const getScroll = () => track.scrollWidth - window.innerWidth;

    gsap.to(track, {
      x: () => -getScroll(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + getScroll(),
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    panels.forEach((panel, i) => {
      const copy = qs('.groom-scroll__copy', panel);
      if (!copy) return;
      gsap.from(copy.children, {
        opacity: 0,
        x: 30,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: () => 'top+=' + (window.innerHeight * (0.15 + i * 0.25)) + ' center',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }

  /* ══════════════════════════════════════════
     SIGNATURE — pinned scale on B1
     ══════════════════════════════════════════ */
  function initSignature() {
    if (!hasGsap || prefersReduced) return;

    const section = qs('.signature');
    const bg = qs('.signature__bg');
    const lines = qsa('.signature__line, .signature__sub', section);
    if (!section || !bg) return;

    const mobile = isMobile();
    const sigEnd = mobile ? '+=60%' : '+=100%';

    if (!mobile) {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: sigEnd,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      });
    }

    gsap.fromTo(bg, { scale: mobile ? 1.06 : 1.15 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: mobile ? 'top bottom' : 'top top',
        end: mobile ? 'bottom top' : sigEnd,
        scrub: true,
      },
    });

    gsap.from(lines, {
      opacity: 0,
      y: 50,
      stagger: 0.15,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  /* ══════════════════════════════════════════
     REVEALS — chapter heads + grids
     ══════════════════════════════════════════ */
  function restoreHashScroll() {
    const hash = pendingHash || window.location.hash;
    if (!hash || hash === '#') return;
    const target = qs(hash);
    if (!target) return;

    const nav = qs('#nav');
    const offset = (nav?.offsetHeight || 0) + 8;

    const go = () => {
      if (hasGsap) ScrollTrigger.refresh();
      requestAnimationFrame(() => {
        const top = Math.max(0, target.offsetTop - offset);
        window.scrollTo(0, top);
        document.documentElement.scrollTop = top;
        if (lenis) lenis.scrollTo(top, { immediate: true });
        flushRevealsInView();
      });
    };

    if (hasGsap && !prefersReduced) {
      gsap.delayedCall(0.65, go);
    } else {
      requestAnimationFrame(go);
    }
  }

  function flushRevealsInView() {
    qsa('.reveal-head, .reveal-grid').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        el.classList.add('is-revealed');
        if (hasGsap) gsap.set(el.children, { clearProps: 'opacity,transform,scale' });
      }
    });
  }

  function initReveals() {
    if (!hasGsap || prefersReduced) {
      qsa('.reveal-head, .reveal-grid').forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    qsa('.reveal-head').forEach((head) => {
      gsap.from(head.children, {
        opacity: 0,
        y: 36,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: head,
          start: 'top 78%',
          toggleActions: 'play none none none',
          onEnter: () => head.classList.add('is-revealed'),
        },
      });
    });

    qsa('.reveal-grid').forEach((grid) => {
      const items = grid.children;
      gsap.from(items, {
        opacity: 0,
        y: 40,
        scale: 0.96,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: grid,
          start: 'top 72%',
          toggleActions: 'play none none none',
          onEnter: () => grid.classList.add('is-revealed'),
        },
      });
    });

    flushRevealsInView();
  }

  /* ══════════════════════════════════════════
     LAZY LOAD — blur-up for .photo
     ══════════════════════════════════════════ */
  function initLazyLoad() {
    const photos = qsa('.photo[data-src]').filter((p) => !p.classList.contains('is-loaded') && !p.closest('.hero__media'));

    const load = (photo) => {
      if (photo.classList.contains('is-loaded')) return;
      const webp = pickImageSrc(photo.dataset.src);
      const jpg = photo.dataset.jpg;
      const img = qs('img', photo);
      if (!img || !webp) return;
      if (!img.getAttribute('width')) {
        img.setAttribute('width', '768');
        img.setAttribute('height', '512');
      }

      const loader = new Image();
      loader.onload = () => {
        img.src = webp;
        img.onerror = () => { if (jpg) img.src = jpg; };
        photo.classList.add('is-loaded');
      };
      loader.onerror = () => {
        if (jpg) img.src = jpg;
        photo.classList.add('is-loaded');
      };
      loader.src = webp;
    };

    if (!('IntersectionObserver' in window)) {
      photos.forEach(load);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          load(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: isMobile() ? '120px 0px' : '280px 0px', threshold: 0.01 });

    photos.forEach((p) => io.observe(p));
  }

  /* ══════════════════════════════════════════
     LIGHTBOX
     ══════════════════════════════════════════ */
  function initLightbox() {
    const lb = qs('#lightbox');
    const dataEl = qs('#lightbox-data');
    if (!lb || !dataEl) return;

    const gallery = JSON.parse(dataEl.textContent);
    const img = qs('.lightbox__img', lb);
    const cap = qs('.lightbox__cap', lb);
    const box = qs('.lightbox__box', lb);
    let index = 0;
    let open = false;
    let lastFocus = null;

    function getFocusables() {
      return qsa('button, [href], [tabindex]:not([tabindex="-1"])', lb)
        .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    }

    function show(i) {
      index = (i + gallery.length) % gallery.length;
      const item = gallery[index];
      if (!item) return;

      box?.classList.remove('is-ready');
      const loader = new Image();
      loader.onload = () => {
        img.src = item.src;
        img.alt = item.cap || '';
        cap.textContent = item.cap || '';
        box?.classList.add('is-ready');
        if (hasGsap && !prefersReduced) {
          gsap.fromTo(img, { scale: 0.94, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.out' });
        }
      };
      loader.onerror = () => {
        img.src = item.jpg || item.src;
        cap.textContent = item.cap || '';
        box?.classList.add('is-ready');
      };
      loader.src = pickImageSrc(item.src);
    }

    function openLb(i) {
      lastFocus = document.activeElement;
      open = true;
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      show(i);
      qs('[data-close]', lb)?.focus();
    }

    function closeLb() {
      open = false;
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      img.src = '';
      box?.classList.remove('is-ready');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    qsa('[data-lightbox]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.lb, 10);
        openLb(Number.isFinite(i) ? i : 0);
      });
    });

    qsa('[data-close]', lb).forEach((el) => el.addEventListener('click', closeLb));
    qs('[data-prev]', lb)?.addEventListener('click', () => show(index - 1));
    qs('[data-next]', lb)?.addEventListener('click', () => show(index + 1));

    lb.addEventListener('keydown', (e) => {
      if (!open || e.key !== 'Tab') return;
      const focusables = getFocusables();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!open) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ══════════════════════════════════════════
     FORM
     ══════════════════════════════════════════ */
  function initForm() {
    const form = qs('#inquiry-form');
    const status = qs('#form-status');
    if (!form) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const submitText = qs('.booking__submit-text', submitBtn) || submitBtn;
    const defaultLabel = submitText?.textContent || 'Book a Consultation';

    const fieldMessages = {
      name: 'Please enter your names.',
      email: 'Please enter a valid email address.',
      date: 'Please choose your wedding date.',
      venue: 'Please enter your venue or city.',
    };

    const syncFieldState = (input) => {
      const field = input.closest('.field');
      if (!field) return;
      const errEl = qs('.field__error', field);
      const valid = input.validity.valid;

      field.classList.toggle('field--error', !valid);
      input.setAttribute('aria-invalid', valid ? 'false' : 'true');

      if (errEl) {
        errEl.textContent = valid ? '' : (fieldMessages[input.id] || input.validationMessage);
      }
    };

    qsa('input, textarea, select', form).forEach((input) => {
      input.addEventListener('invalid', (e) => {
        e.preventDefault();
        syncFieldState(input);
      });
      input.addEventListener('input', () => syncFieldState(input));
      input.addEventListener('blur', () => {
        if (input.value) syncFieldState(input);
      });
    });

    const showStatus = (text, isError, isHtml) => {
      if (!status) return;
      if (isHtml) {
        status.innerHTML = text;
      } else {
        status.textContent = text;
      }
      status.style.color = isError ? '#ffd4d4' : '';
      if (hasGsap && !prefersReduced) {
        gsap.fromTo(status, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45 });
      }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const invalid = qsa('input, textarea, select', form).filter((input) => {
        const ok = input.checkValidity();
        syncFieldState(input);
        return !ok;
      });

      if (invalid.length) {
        invalid[0].focus();
        showStatus('Check names, email, wedding date, and venue — those fields are required.', true);
        window.dispatchEvent(new CustomEvent('site:form', {
          detail: { event: 'form_error', fields: invalid.map((i) => i.id) },
        }));
        return;
      }

      const payload = {
        name: qs('#name', form)?.value?.trim(),
        email: qs('#email', form)?.value?.trim(),
        date: qs('#date', form)?.value,
        venue: qs('#venue', form)?.value?.trim(),
        package: qs('#package', form)?.value || '',
        message: qs('#message', form)?.value?.trim() || '',
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitText.textContent = 'Sending…';
      }

      try {
        const res = await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || 'Submission failed');
        showStatus(data.message || 'Thank you — Rohan will respond within 48 hours.', false);
        window.dispatchEvent(new CustomEvent('site:form', { detail: { event: 'form_success' } }));
        form.reset();
        qsa('.field', form).forEach((f) => f.classList.remove('field--error'));
        qsa('input, textarea, select', form).forEach((input) => {
          input.setAttribute('aria-invalid', 'false');
          const errEl = qs('.field__error', input.closest('.field'));
          if (errEl) errEl.textContent = '';
        });
        if (submitBtn) {
          submitText.textContent = 'Sent ✓';
          setTimeout(() => {
            submitBtn.disabled = false;
            submitText.textContent = defaultLabel;
          }, 2800);
        }
        return;
      } catch (err) {
        window.dispatchEvent(new CustomEvent('site:form', { detail: { event: 'form_fail' } }));
        const mail = window.SITE?.contact?.email || 'hello@rohankapoor.photo';
        showStatus(
          `Something went wrong — please <a href="mailto:${mail}" style="color:inherit;text-decoration:underline">email ${mail}</a> directly.`,
          true,
          true
        );
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitText.textContent = defaultLabel;
      }
    });
  }

  /* ══════════════════════════════════════════
     FRAME HOVER — subtle lift
     ══════════════════════════════════════════ */
  function initFrameHovers() {
    if (!hasGsap || prefersReduced || isTouch()) return;
    qsa('.frame[data-lightbox]').forEach((frame) => {
      frame.addEventListener('mouseenter', () => {
        gsap.to(frame, { y: -4, duration: 0.35, ease: 'power2.out' });
      });
      frame.addEventListener('mouseleave', () => {
        gsap.to(frame, { y: 0, duration: 0.4, ease: 'power2.out' });
      });
    });
  }

  /* ══════════════════════════════════════════
     BUTTON HOVER POLISH
     ══════════════════════════════════════════ */
  function initButtonHovers() {
    if (!hasGsap || prefersReduced || isTouch()) return;
    qsa('.btn').forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, { y: -2, boxShadow: '0 12px 28px rgba(184,154,99,.35)', duration: 0.25, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { y: 0, boxShadow: 'none', duration: 0.25, ease: 'power2.out' });
      });
    });
  }

  /* ══════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════ */
  function bootAnimations() {
    if (hasGsap) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ limitCallbacks: true });
      if (isMobile()) ScrollTrigger.normalizeScroll(false);
    }

    document.documentElement.classList.toggle('is-mobile', isMobile());
    document.documentElement.classList.toggle('is-touch', isTouch());
    document.documentElement.classList.toggle('is-desktop', isDesktop());

    lenis = initLenis();
    initScrollProgress();
    initNav();
    initHero();
    initStakes();
    initPromise();
    initGroomScroll();
    initSignature();
    initReveals();
    initTextEffects();
    initLazyLoad();
    initLightbox();
    initForm();
    initFrameHovers();
    initButtonHovers();

    if (hasGsap) {
      ScrollTrigger.refresh();
      flushRevealsInView();
      restoreHashScroll();
      window.addEventListener('load', () => {
        ScrollTrigger.refresh();
        flushRevealsInView();
        restoreHashScroll();
      });
      window.addEventListener('resize', () => ScrollTrigger.refresh());
    } else {
      restoreHashScroll();
    }
  }

  function boot() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    initPreloader(bootAnimations);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Fallback without GSAP */
  if (!hasGsap) {
    document.addEventListener('DOMContentLoaded', () => {
      initNav();
      initLazyLoad();
      initLightbox();
      initForm();
      qs('#preloader')?.classList.add('is-done');
      qs('.hero__media') && (qs('.hero__media').style.clipPath = 'none');
      qsa('.hero__eyebrow, .hero__title, .hero__sub, .hero__actions, .hero__scroll').forEach((el) => {
        if (el) el.style.opacity = '1';
      });
    });
  }
})();