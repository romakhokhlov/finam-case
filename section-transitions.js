(() => {
  // Scroll-synchronised opaque media overlays. Carousel tracks are never transformed here.
  const definitions = [
    ['hero-showcase', '#case-intro', 'hero-showcase'],
    ['key-visual-media', '#key-visual-copy', 'key-visual'],
    ['modular-media', '#modular-copy', 'modular-block-system'],
    ['components-media', '#components > .feature-copy', 'components'],
    ['examples-media', '#page-examples > .feature-copy', 'page-examples'],
  ];
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const pairs = definitions.map(([mediaId, copySelector, sectionId]) => ({
    media: document.getElementById(mediaId),
    copy: document.querySelector(copySelector),
    section: document.getElementById(sectionId),
    appliedShift: 0,
    maxShift: 0,
    start: 0,
    distance: 1,
    progress: -1,
  })).filter(pair => pair.media && pair.copy && pair.section);
  if (pairs.length !== definitions.length) return;

  let active = false;
  let scheduled = false;
  let measurementScheduled = false;

  function clear() {
    root.classList.remove('has-section-overlaps');
    for (const pair of pairs) {
      pair.section.style.removeProperty('--overlap-reclaim');
      pair.media.style.removeProperty('--overlap-translate');
      pair.copy.style.removeProperty('--overlap-copy-opacity');
      pair.appliedShift = 0;
      pair.progress = -1;
    }
  }

  function measure() {
    measurementScheduled = false;
    if (!active) return;
    // Reflow is intentionally limited to refreshes (resize, font/image/slide changes),
    // never performed in the scroll animation loop.
    for (const pair of pairs) pair.section.style.setProperty('--overlap-reclaim', '0px');

    for (const pair of pairs) {
      const textHeight = pair.copy.offsetHeight;
      const styles = getComputedStyle(pair.copy);
      const gap = parseFloat(styles.marginBottom) || 0;
      const mediaHeight = pair.media.offsetHeight;
      pair.maxShift = Math.round(Math.max(0, Math.min(
        textHeight + gap,
        mediaHeight * 0.86,
        innerHeight * 0.42
      )));
      pair.section.style.setProperty('--overlap-reclaim', `${pair.maxShift}px`);
    }

    // Derive scroll ranges after all compensating margins enter the normal flow.
    for (const pair of pairs) {
      const naturalTop = pair.media.getBoundingClientRect().top + scrollY + pair.appliedShift;
      pair.start = Math.max(0, naturalTop - innerHeight * 0.82);
      pair.distance = Math.max(170, Math.min(innerHeight * 0.64, pair.maxShift * 1.45));
      pair.progress = -1;
    }
    render();
  }

  function render() {
    scheduled = false;
    if (!active) return;
    const position = scrollY;
    for (const pair of pairs) {
      const progress = clamp((position - pair.start) / pair.distance);
      if (progress === pair.progress) continue;
      pair.progress = progress;
      pair.appliedShift = pair.maxShift * progress;
      pair.media.style.setProperty('--overlap-translate', `${-pair.appliedShift.toFixed(2)}px`);
      pair.copy.style.setProperty('--overlap-copy-opacity', (1 - progress).toFixed(3));
    }
  }

  function schedule() {
    if (!active || scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  function scheduleMeasurement() {
    if (!active || measurementScheduled) return;
    measurementScheduled = true;
    requestAnimationFrame(measure);
  }

  function updatePreference() {
    active = !reducedMotion.matches;
    if (!active) clear();
    else {
      root.classList.add('has-section-overlaps');
      scheduleMeasurement();
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', scheduleMeasurement, { passive: true });
  window.addEventListener('load', scheduleMeasurement, { once: true });
  document.fonts?.ready?.then(scheduleMeasurement);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasurement);
  for (const {media, copy} of pairs) {
    observer?.observe(media);
    observer?.observe(copy);
  }
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', updatePreference);
  else reducedMotion.addListener?.(updatePreference);
  updatePreference();
})();
