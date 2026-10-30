(() => {
  // Animate artwork only, not the solid-background media sections or carousel controls.
  const selector = [
    '#hero-artboard .hero-tile',
    '#key-visual-carousel-track',
    '#modular-carousel-track',
    '#components-carousel-track',
    '#examples-media .page-shot'
  ].join(', ');
  const targets = [...document.querySelectorAll(selector)];
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;

  // No pre-hidden state: images remain visible if scripting fails.
  // Each artwork surface animates once, independent of carousel slide changes.
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
