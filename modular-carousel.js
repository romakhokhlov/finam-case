(() => {
  const root = document.getElementById('modular-carousel');
  const track = document.getElementById('modular-carousel-track');
  if (!root || !track) return;
  const slides = [...track.querySelectorAll('.modular-slide')];
  if (!slides.length) return;
  root.insertAdjacentHTML('beforeend', '<button class="modular-control modular-prev" type="button" aria-label="Previous slide">‹</button><button class="modular-control modular-next" type="button" aria-label="Next slide">›</button><div class="modular-pagination" aria-label="Slide navigation">' + slides.map((_, i) => '<button class="modular-dot' + (i === 0 ? ' is-current' : '') + '" type="button" aria-label="Go to slide ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>').join('') + '</div>');
  const dots = [...root.querySelectorAll('.modular-dot')];
  let current = 0, startX = null;
  const viewport = root.querySelector('#modular-carousel-viewport');
  const mobileLayout = window.matchMedia('(max-width: 767px)');
  const syncMobileSlideHeight = () => {
    if (!viewport) return;
    if (!mobileLayout.matches) {
      viewport.style.removeProperty('height');
      return;
    }
    const image = slides[current]?.querySelector('img');
    const height = image?.getBoundingClientRect().height ?? 0;
    if (height > 0) viewport.style.height = `${height}px`;
  };
  const go = (index) => {
    current = (index + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    dots.forEach((dot, i) => { dot.classList.toggle('is-current', i === current); dot.setAttribute('aria-current', String(i === current)); });
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== current)));
    syncMobileSlideHeight();
  };
  root.querySelector('.modular-prev').addEventListener('click', () => go(current - 1));
  root.querySelector('.modular-next').addEventListener('click', () => go(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
  root.tabIndex = 0;
  root.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); go(current + (event.key === 'ArrowRight' ? 1 : -1)); } });
  root.addEventListener('touchstart', (event) => { startX = event.changedTouches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (event) => { if (startX === null) return; const delta = event.changedTouches[0].clientX - startX; if (Math.abs(delta) > 40) go(current + (delta < 0 ? 1 : -1)); startX = null; }, { passive: true });
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
  go(0);
})();
