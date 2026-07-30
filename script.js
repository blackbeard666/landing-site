/* ============================================================
   carlojaeavila.dev — page behaviour.
   Loaded with `defer`. Three independent blocks; each no-ops if its
   markup isn't present.

   The hero pattern slider lives in js/patterns-slider.js.
   ============================================================ */

/* ---- Scroll spy -------------------------------------------------------
   Only observes sections that actually have a nav link. The previous
   version observed every `section[id]`, so scrolling into an unlinked
   section (#currently, #projects, #find-me at the time) cleared .active
   and matched nothing — the nav simply went blank. Also sets
   aria-current so the state is exposed, not just coloured.
   -------------------------------------------------------------------- */
(function scrollSpy() {
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map();
  const targets = [];
  links.forEach((link) => {
    const id = decodeURIComponent(link.hash.slice(1));
    const section = id && document.getElementById(id);
    if (!section) return;
    byId.set(section, link);
    targets.push(section);
  });
  if (!targets.length) return;

  function setActive(link) {
    links.forEach((l) => {
      const on = l === link;
      l.classList.toggle('active', on);
      if (on) l.setAttribute('aria-current', 'true');
      else l.removeAttribute('aria-current');
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(byId.get(entry.target));
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  targets.forEach((s) => observer.observe(s));
})();

/* ---- Theme toggle ----------------------------------------------------
   The saved preference is applied by the inline guard in <head>; this
   only handles the click and keeps the label truthful. Dark is default,
   so only 'light' is ever written to storage.
   -------------------------------------------------------------------- */
(function themeToggle() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;

  const root = document.documentElement;

  function paint() {
    const light = root.dataset.theme === 'light';
    btn.setAttribute('aria-pressed', String(light));
    btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  }

  btn.addEventListener('click', () => {
    const light = root.dataset.theme === 'light';
    if (light) {
      delete root.dataset.theme;
      localStorage.removeItem('theme');
    } else {
      root.dataset.theme = 'light';
      localStorage.setItem('theme', 'light');
    }
    paint();
  });

  paint();
})();

/* ---- Copy buttons ----------------------------------------------------
   Generic over [data-code-block] so it covers the slider's panel and any
   code block added later. Reads innerText at click time, which is what
   makes it work with the slider swapping its own contents.
   -------------------------------------------------------------------- */
(function copyButtons() {
  document.querySelectorAll('[data-code-block]').forEach((block) => {
    const btn = block.querySelector('[data-copy]');
    const pre = block.querySelector('pre');
    if (!btn || !pre || !navigator.clipboard) return;

    let reset;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        btn.textContent = 'copied';
      } catch {
        btn.textContent = 'press ⌘/ctrl+c';
      }
      clearTimeout(reset);
      reset = setTimeout(() => { btn.textContent = 'copy'; }, 1600);
    });
  });
})();

/* ---- Footer year ---------------------------------------------------- */
(function footerYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
})();

/* ---- Years of experience -------------------------------------------
   Computed from data-since="YYYY-MM" rather than written into the markup.
   A hardcoded tenure silently goes stale, and a stale experience claim is
   worse than no claim — same reasoning as the footer year. Floors to whole
   years and never rounds up, so the number can only understate.
   -------------------------------------------------------------------- */
(function yearsSince() {
  const el = document.querySelector('[data-since]');
  if (!el) return;

  const m = /^(\d{4})-(\d{2})$/.exec(el.dataset.since || '');
  if (!m) return;                                  // leave the fallback text

  const start = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  if (now.getMonth() < start.getMonth()) years -= 1;

  if (years >= 1) el.textContent = years + '+ years';
})();
