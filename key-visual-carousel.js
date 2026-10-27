(() => {
  const root = document.getElementById('key-visual-carousel');
  const track = document.getElementById('key-visual-carousel-track');
  if (!root || !track) return;
  const slides = [...track.querySelectorAll('.key-visual-slide')];
  if (slides.length < 2) return;
  const previous = root.querySelector('.key-visual-prev');
  const next = root.querySelector('.key-visual-next');
  const dots = [...root.querySelectorAll('.key-visual-dot')];
  let current = 0;
  let touchStartX = null;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    track.style.transform = 'translate3d(-' + current * 100 + '%,0,0)';
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-current', i === current);
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  previous?.addEventListener('click', () => show(current - 1));
  next?.addEventListener('click', () => show(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
  });

  root.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
  }, {passive: true});
  root.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const x = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = x - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) >= 40) show(current + (delta < 0 ? 1 : -1));
  }, {passive: true});
  show(0);
})();
