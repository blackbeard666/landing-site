const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));

// Recent training — auto-scrolling compact ticker + "show more". Progressive
// enhancement: without JS the full static list renders (no scroll, no clip).
// With JS, if the list overflows the compact window we clone it for a seamless
// vertical marquee and reveal a toggle to expand the full static list.
(function () {
  const viewport = document.querySelector('.training-viewport');
  const track = document.querySelector('.training-track');
  const groups = document.querySelector('.training-groups');
  const btn = document.querySelector('.training-more');
  if (!viewport || !track || !groups || !btn) return;

  const COMPACT_PX = 9.5 * 14; // matches .is-compact max-height (rem × 14px root)
  if (groups.scrollHeight <= COMPACT_PX + 4) return; // fits — leave full, no button

  // Duplicate the list so translateY(-50%) loops seamlessly.
  const clone = groups.cloneNode(true);
  clone.classList.add('training-clone');
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
  track.appendChild(clone);

  // ~40px/sec, so longer lists scroll proportionally (min 20s).
  track.style.setProperty('--marquee-dur', Math.max(20, Math.round(groups.scrollHeight / 40)) + 's');

  viewport.classList.add('is-compact');
  btn.hidden = false;
  btn.addEventListener('click', () => {
    const compact = viewport.classList.toggle('is-compact');
    btn.textContent = compact ? 'show more' : 'show less';
    // Collapsing from a long expanded list leaves the viewport far down the
    // page — scroll the training group back into view (scroll-margin-top on
    // .cert-group clears the sticky nav).
    if (compact) {
      viewport.closest('.cert-group').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();
