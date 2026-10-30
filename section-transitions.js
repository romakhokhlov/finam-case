(() => {
  // Progressive enhancement: the page remains unchanged without JS or with reduced motion.
  const hero = document.getElementById('hero-showcase');
  const next = document.getElementById('insights');
  if (!hero || !next || typeof window.matchMedia !== 'function') return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  let enabled = false;
  let framePending = false;
  let previousProgress = -1;

  const clamp01 = value => Math.max(0, Math.min(1, value));

  function render() {
    framePending = false;
    if (!enabled) return;

    // The next section stays in document flow; only the preceding artwork shifts.
    // Measuring the next section (not the transformed hero) avoids feedback loops.
    const viewportHeight = window.innerHeight;
    const start = viewportHeight * 0.9;
    const finish = viewportHeight * 0.12;
    const progress = clamp01((start - next.getBoundingClientRect().top) / (start - finish));
    if (progress === previousProgress) return;

    const sectionGap = parseFloat(getComputedStyle(next).marginTop) || 0;
    const maxShift = Math.min(hero.offsetHeight * 0.75, sectionGap + 40, 240);
    hero.style.setProperty('--section-overlap-shift', Math.round(maxShift * progress) + 'px');
    hero.style.setProperty('--section-overlap-dim', (progress * 0.15).toFixed(3));
    previousProgress = progress;
  }

  function schedule() {
    if (!enabled || framePending) return;
    framePending = true;
    requestAnimationFrame(render);
  }

  function updatePreference() {
    enabled = !motionPreference.matches;
    root.classList.toggle('has-hero-overlap', enabled);
    if (!enabled) {
      hero.style.removeProperty('--section-overlap-shift');
      hero.style.removeProperty('--section-overlap-dim');
      previousProgress = -1;
    } else {
      previousProgress = -1;
      schedule();
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    previousProgress = -1;
    schedule();
  }, { passive: true });
  window.addEventListener('load', schedule, { once: true });
  document.fonts?.ready?.then(schedule);
  if (motionPreference.addEventListener) {
    motionPreference.addEventListener('change', updatePreference);
  } else {
    motionPreference.addListener?.(updatePreference);
  }
  updatePreference();
})();
