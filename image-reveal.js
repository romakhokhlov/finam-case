(() => {
  // Reveal each image with its shadow; solid media panels and carousel slides stay unchanged.
  const standalone = [
    ...document.querySelectorAll('#hero-artboard .hero-tile'),
    ...document.querySelectorAll('#examples-media .page-shot')
  ];
  const records = standalone.map(surface => ({
    watch: surface,
    image: () => surface,
    prepared: null,
    done: false
  }));

  for (const [panelId, slideClass] of [
    ['key-visual-media', 'key-visual-slide'],
    ['modular-media', 'modular-slide'],
    ['components-media', 'components-slide']
  ]) {
    const panel = document.getElementById(panelId);
    if (!panel) continue;
    records.push({
      watch: panel,
      image: () => panel.querySelector(`.${slideClass}.is-current img`) ||
        panel.querySelector(`.${slideClass} img`),
      prepared: null,
      done: false
    });
  }

  if (!records.length || !('IntersectionObserver' in window)) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;

  let observer;
  const clearPending = record => {
    record.prepared?.classList.remove('image-reveal-pending');
    record.prepared = null;
  };
  const reveal = record => {
    if (record.done) return;
    record.done = true;
    const image = record.image();
    clearPending(record);
    if (!motion.matches && image) image.classList.add('image-scroll-reveal');
    observer?.unobserve(record.watch);
  };

  try {
    const lookup = new Map(records.map(record => [record.watch, record]));
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.18) continue;
        const record = lookup.get(entry.target);
        if (record) reveal(record);
      }
    }, {threshold: [0, 0.18]});

    // Apply the hidden starting state only after the observer exists.
    // Inactive carousel slides never receive it, preserving crossfade navigation.
    for (const record of records) {
      const image = record.image();
      if (image) {
        record.prepared = image;
        image.classList.add('image-reveal-pending');
      }
      observer.observe(record.watch);
    }
  } catch (_) {
    observer?.disconnect();
    records.forEach(clearPending); // Fail open if observer setup fails.
    return;
  }

  // Restore-to-scroll and bfcache can position images inside the viewport on load.
  const revealVisible = () => {
    if (motion.matches) return;
    for (const record of records) {
      if (record.done) continue;
      const rect = record.watch.getBoundingClientRect();
      if (!rect.height || !rect.width) continue;
      const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
      if (visibleHeight / rect.height >= 0.18) reveal(record);
    }
  };
  window.addEventListener('pageshow', () => requestAnimationFrame(revealVisible));
  window.addEventListener('load', () => requestAnimationFrame(revealVisible), {once: true});

  const onPreferenceChange = () => {
    if (!motion.matches) return;
    observer?.disconnect();
    for (const record of records) {
      clearPending(record);
      record.image()?.classList.remove('image-scroll-reveal');
    }
  };
  if (motion.addEventListener) motion.addEventListener('change', onPreferenceChange);
  else motion.addListener?.(onPreferenceChange);
})();
