(() => {
  // Animate outer media surfaces, not crossfade slides or hover-scaled images.
  const selector = [
    '#hero-showcase',
    '#key-visual-media',
    '#modular-media',
    '#components-media',
    '#examples-media .page-shot'
  ].join(', ');
  const targets = [...document.querySelectorAll(selector)];
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;

  // No pre-hidden state: images remain visible if scripting fails.
  // Each surface animates once, independent of carousel slide changes.
  let observer;
  try {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.18) continue;
        entry.target.classList.add('image-scroll-reveal');
        observer.unobserve(entry.target);
      }
    }, { threshold: [0, 0.18] });
    targets.forEach(target => observer.observe(target));
  } catch (_) {
    observer?.disconnect();
  }

  const onPreferenceChange = () => {
    if (!motion.matches) return;
    observer?.disconnect();
    targets.forEach(target => target.classList.remove('image-scroll-reveal'));
  };
  if (motion.addEventListener) motion.addEventListener('change', onPreferenceChange);
  else motion.addListener?.(onPreferenceChange);
})();
