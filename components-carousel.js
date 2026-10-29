(() => {
  const root = document.getElementById('components-carousel');
  const track = document.getElementById('components-carousel-track');
  if (!root || !track) return;
  const slides = [...track.querySelectorAll('.components-slide')];
  const dots = [...root.querySelectorAll('.components-dot')];
  if (slides.length < 2 || dots.length !== slides.length) return;
  let index = 0;
  let touchX = null;
  const viewport = root.querySelector('#components-carousel-viewport');
  const mobileLayout = window.matchMedia('(max-width: 767px)');
  const syncMobileSlideHeight = () => {
    if (!viewport) return;
    if (!mobileLayout.matches) {
      viewport.style.removeProperty('height');
      return;
    }
    const image = slides[index]?.querySelector('img');
    const height = image?.getBoundingClientRect().height ?? 0;
    if (height > 0) viewport.style.height = `${height}px`;
  };

  const show = target => {
    index = (target + slides.length) % slides.length;
    track.style.transform = 'translate3d(-' + index * 100 + '%,0,0)';
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-current', i === index);
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    syncMobileSlideHeight();
  };

  root.querySelector('.components-prev')?.addEventListener('click', () => show(index - 1));
  root.querySelector('.components-next')?.addEventListener('click', () => show(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  root.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(index + (event.key === 'ArrowRight' ? 1 : -1));
  });
  root.addEventListener('touchstart', event => {
    touchX = event.changedTouches[0]?.clientX ?? null;
  }, {passive: true});
  root.addEventListener('touchend', event => {
    if (touchX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchX) - touchX;
    touchX = null;
    if (Math.abs(delta) >= 40) show(index + (delta < 0 ? 1 : -1));
  }, {passive: true});
  /* On mobile, the viewport follows the active image, even when slides have
     different intrinsic proportions or finish lazy-loading after navigation. */
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncMobileSlideHeight);
  for (const slide of slides) {
    const image = slide.querySelector('img');
    if (!image) continue;
    image.addEventListener('load', syncMobileSlideHeight);
    observer?.observe(image);
  }
  window.addEventListener('resize', syncMobileSlideHeight);
  mobileLayout.addEventListener?.('change', syncMobileSlideHeight);
  show(0);
})();
