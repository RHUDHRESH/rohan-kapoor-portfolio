/**
 * Rohan Kapoor — content binding & conversion instrumentation
 */
(function () {
  'use strict';

  const SITE = window.SITE;
  if (!SITE) return;

  function track(event, props) {
    const detail = { event, ...props, ts: Date.now() };
    window.dispatchEvent(new CustomEvent('site:analytics', { detail }));
    if (typeof window.plausible === 'function') {
      window.plausible(event, { props });
    }
  }

  function renderPackages() {
    const grid = document.getElementById('packages-grid');
    if (!grid || !SITE.packages) return;

    grid.innerHTML = SITE.packages.map((pkg) => `
      <article class="package${pkg.featured ? ' package--featured' : ''}">
        ${pkg.badge ? `<span class="package__badge">${pkg.badge}</span>` : ''}
        <h3 class="package__name">${pkg.name}</h3>
        <p class="package__range">${pkg.range}</p>
        <p class="package__list">${pkg.features}</p>
        ${pkg.outcome ? `<p class="package__outcome">${pkg.outcome}</p>` : ''}
      </article>`).join('');
  }

  function renderTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    if (!grid || !SITE.testimonials) return;

    grid.innerHTML = SITE.testimonials.map((t) => `
      <blockquote class="testimonial">
        <q>${t.quote}</q>
        <cite>${t.package} package · ${t.couple} · ${t.location} · ${t.date}</cite>
      </blockquote>`).join('');
  }

  function renderTrust() {
    const list = document.getElementById('booking-trust');
    if (!list || !SITE.bookingTrust) return;
    list.innerHTML = SITE.bookingTrust.map((item) => `<li>${item}</li>`).join('');
  }

  function renderPackageSelect() {
    const select = document.getElementById('package');
    if (!select || !SITE.packages) return;
    const current = select.value;
    select.innerHTML = [
      '<option value="">Select a package</option>',
      ...SITE.packages.map((p) =>
        `<option value="${p.id}">${p.name} — ${p.range}</option>`
      ),
    ].join('');
    if (current) select.value = current;
  }

  function syncLightboxData() {
    const el = document.getElementById('lightbox-data');
    if (!el || !SITE.lightbox) return;
    el.textContent = JSON.stringify(SITE.lightbox);
  }

  function bindContact() {
    const c = SITE.contact;
    if (!c) return;

    const emailLink = document.querySelector('.booking__link[href^="mailto"]');
    if (emailLink) {
      emailLink.href = `mailto:${c.email}`;
      emailLink.dataset.cta = 'email';
      const val = emailLink.querySelector('.booking__link-v');
      if (val) val.textContent = c.email;
    }

    const waLink = document.querySelector('.booking__link[href*="wa.me"]');
    if (waLink) {
      waLink.href = c.whatsappUrl;
      waLink.dataset.cta = 'whatsapp';
      const val = waLink.querySelector('.booking__link-v');
      if (val) val.textContent = c.whatsappLabel;
    }

    const igLink = document.querySelector('.booking__link[href*="instagram"]');
    if (igLink) {
      igLink.href = c.instagramUrl;
      igLink.dataset.cta = 'instagram';
      const val = igLink.querySelector('.booking__link-v');
      if (val) val.textContent = c.instagramHandle;
    }
  }

  function injectMobileCta() {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    if (document.getElementById('mobile-cta')) return;

    const bar = document.createElement('div');
    bar.id = 'mobile-cta';
    bar.className = 'mobile-cta';
    bar.innerHTML = `
      <a href="${SITE.contact.whatsappUrl}" class="mobile-cta__btn mobile-cta__btn--wa" data-cta="mobile-whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a href="#booking" class="mobile-cta__btn mobile-cta__btn--book" data-cta="mobile-book">Book Consultation</a>`;
    document.body.appendChild(bar);

    const hideNearBooking = () => {
      const booking = document.getElementById('booking');
      if (!booking) return;
      const rect = booking.getBoundingClientRect();
      const near = rect.top < window.innerHeight * 0.6;
      bar.classList.toggle('is-hidden', near);
    };
    window.addEventListener('scroll', hideNearBooking, { passive: true });
    hideNearBooking();
  }

  function initCollapsibleForm() {
    const toggle = document.getElementById('message-toggle');
    const panel = document.getElementById('message-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initAnalytics() {
    document.addEventListener('click', (e) => {
      const cta = e.target.closest('[data-cta]');
      if (cta) track('cta_click', { cta: cta.dataset.cta });
    });

    window.addEventListener('site:form', (e) => {
      track(e.detail.event, e.detail);
    });

    const depths = [25, 50, 75, 100];
    const fired = new Set();
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = (window.scrollY / max) * 100;
      depths.forEach((d) => {
        if (pct >= d && !fired.has(d)) {
          fired.add(d);
          track('scroll_depth', { depth: d });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function boot() {
    document.documentElement.classList.remove('no-js');
    renderPackages();
    renderTestimonials();
    renderTrust();
    renderPackageSelect();
    syncLightboxData();
    bindContact();
    injectMobileCta();
    initCollapsibleForm();
    initAnalytics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();