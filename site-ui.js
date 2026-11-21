(function () {
  const root = document.documentElement;
  root.classList.add('has-js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 1. Floating pill header, scroll progress ring & ambient duo progress
  const header = document.querySelector('.site-header');
  const backToTop = document.querySelector('.back-to-top');
  const progressCircle = document.querySelector('.back-to-top-progress');
  const tryDuo = document.querySelector('.try-duo');
  const circumference = progressCircle ? 2 * Math.PI * 19 : 0;
  if (progressCircle) {
    progressCircle.style.strokeDasharray = String(circumference);
    progressCircle.style.strokeDashoffset = String(circumference);
  }

  let ticking = false;
  function updateScrollState() {
    ticking = false;
    const y = window.scrollY || window.pageYOffset || 0;
    if (header) {
      if (y > 24) header.setAttribute('data-scrolled', '');
      else header.removeAttribute('data-scrolled');
    }

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, y / maxScroll));

    if (backToTop) {
      if (y > 360) backToTop.setAttribute('data-visible', '');
      else backToTop.removeAttribute('data-visible');
    }
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = String(circumference * (1 - ratio));
    }

    if (tryDuo && !reducedMotion.matches) {
      const rect = tryDuo.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const p = Math.min(1, Math.max(0, (vh * 0.78 - rect.top) / (vh * 0.65)));
      tryDuo.style.setProperty('--duo-p', p.toFixed(3));
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScrollState);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
  }

  // 2. Staggered IntersectionObserver scroll reveals
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach((el) => observer.observe(el));
    }
  }

  // 3. Hero Interactive Browser Search Stage
  const stage = document.querySelector('[data-hero-stage]');
  if (stage) {
    const tabs = [...stage.querySelectorAll('[data-stage-tab]')];
    const panels = [...stage.querySelectorAll('[data-stage-panel]')];
    let current = 0;
    let paused = false;
    let cycleTimer = null;

    function activateStage(index, focusTab) {
      current = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        const active = i === current;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focusTab) tab.focus();
      });
      panels.forEach((panel, i) => {
        const active = i === current;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        paused = true;
        activateStage(i, false);
      });
      tab.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          paused = true;
          const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
          const delta = event.key === 'ArrowRight' ? dir : -dir;
          activateStage(i + delta, true);
        }
      });
    });

    stage.addEventListener('mouseenter', () => { paused = true; });
    stage.addEventListener('focusin', () => { paused = true; });
    stage.addEventListener('mouseleave', () => { paused = false; });

    if (!reducedMotion.matches && tabs.length > 1) {
      cycleTimer = window.setInterval(() => {
        if (!paused && !stage.contains(document.activeElement) && !document.hidden) activateStage(current + 1, false);
      }, 5200);
      window.addEventListener('pagehide', () => window.clearInterval(cycleTimer));
    }


  }

  // 4. Sticky "Try it live" 3-step highlighter synchronized with real workbench
  const steps = [...document.querySelectorAll('[data-try-step]')];
  const form = document.getElementById('search-form');
  const queryInput = document.getElementById('search-query');
  const preview = document.getElementById('search-preview');
  const workbench = document.getElementById('search-tool');
  if (steps.length && form && queryInput && preview) {
    function setActiveStep(stepNumber) {
      steps.forEach((el) => {
        const num = Number(el.dataset.tryStep);
        el.classList.toggle('is-active', num === stepNumber);
        el.classList.toggle('is-complete', num < stepNumber);
      });
    }

    function syncStepFromWorkbench() {
      if (!preview.hidden) {
        setActiveStep(3);
      } else if (form.getAttribute('aria-busy') === 'true') {
        setActiveStep(2);
      } else if (queryInput.value.trim().length > 0) {
        setActiveStep(2);
      } else {
        setActiveStep(1);
      }
    }

    queryInput.addEventListener('input', syncStepFromWorkbench);
    form.addEventListener('submit', () => setActiveStep(2));

    const mo = new MutationObserver(syncStepFromWorkbench);
    mo.observe(preview, { attributes: true, attributeFilter: ['hidden'] });
    mo.observe(form, { attributes: true, attributeFilter: ['aria-busy'] });
    syncStepFromWorkbench();

    // Clicking a step scrolls/focuses the relevant part of the workbench
    steps.forEach((step) => {
      step.addEventListener('click', () => {
        const num = Number(step.dataset.tryStep);
        if (num === 1) queryInput.focus();
        else if (num === 2) document.getElementById('translate-query')?.focus();
        else if (num === 3 && !preview.hidden) document.getElementById('translated-query')?.focus();
        else if (workbench) workbench.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
      });
    });
  }

  // 5. "See it in action" Extension Interactive 3-Tab Simulator
  const actionDemo = document.querySelector('[data-action-demo]');
  if (actionDemo) {
    const tabs = [...actionDemo.querySelectorAll('[data-demo-tab]')];
    const panels = [...actionDemo.querySelectorAll('[data-demo-panel]')];

    function activateDemo(index, focusTab) {
      const next = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        const active = i === next;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focusTab) tab.focus();
      });
      panels.forEach((panel, i) => {
        const active = i === next;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activateDemo(i, false));
      tab.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const rtl = root.dir === 'rtl';
          const isPrev = event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') || event.key === 'ArrowUp';
          activateDemo(i + (isPrev ? -1 : 1), true);
        }
      });
    });
  }
})();
