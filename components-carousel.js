/* Canonical Finam carousel: one crossfade controller for all comparable galleries. */
(() => {
  const mobile = window.matchMedia('(max-width: 767px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 400;
  const galleries = [
    {id: 'components-carousel', slide: '.components-slide', dot: '.components-dot', prev: '.components-prev', next: '.components-next'},
    {id: 'key-visual-carousel', slide: '.key-visual-slide', dot: '.key-visual-dot', prev: '.key-visual-prev', next: '.key-visual-next'},
    {id: 'modular-carousel', slide: '.modular-slide', dot: '.modular-dot', prev: '.modular-prev', next: '.modular-next'}
  ];

  for (const config of galleries) {
    const root = document.getElementById(config.id);
    const track = document.getElementById(`${config.id}-track`);
    const viewport = document.getElementById(`${config.id}-viewport`);
    if (!root || !track || !viewport) continue;
    const slides = [...track.querySelectorAll(config.slide)];
    if (slides.length < 2) continue;

    // The Modular gallery previously generated its controls in its own script.
    if (config.id === 'modular-carousel') {
      root.insertAdjacentHTML('beforeend', `<button class="modular-control modular-prev" type="button" aria-label="Previous slide">‹</button><button class="modular-control modular-next" type="button" aria-label="Next slide">›</button><div class="modular-pagination" aria-label="Slide navigation">${slides.map((_, i) => `<button class="modular-dot${i === 0 ? ' is-current' : ''}" type="button" aria-label="Go to slide ${i + 1}"></button>`).join('')}</div>`);
      root.setAttribute('aria-roledescription', 'carousel');
      root.tabIndex = 0;
      slides.forEach(slide => slide.setAttribute('aria-roledescription', 'slide'));
    }

    const dots = [...root.querySelectorAll(config.dot)];
    if (dots.length !== slides.length) continue;
    let current = 0;
    let requested = 0;
    let busy = false;
    let touchStart = null;

    const syncHeight = () => {
      if (!mobile.matches) {
        viewport.style.removeProperty('height');
        return;
      }
      const image = slides[current].querySelector('img');
      const height = image?.getBoundingClientRect().height ?? 0;
      if (height > 0) viewport.style.height = `${Math.ceil(height)}px`;
    };

    const updateState = () => {
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-current', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((dot, i) => {
        const active = i === current;
        dot.classList.toggle('is-current', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      syncHeight();
    };

    const normalize = index => (index % slides.length + slides.length) % slides.length;
    const process = async () => {
      if (busy || requested === current) return;
      busy = true;
      const target = requested;
      const image = slides[target].querySelector('img');
      if (image) {
        // Keep the previous slide visible until the destination image is decoded.
        image.loading = 'eager';
        if (image.decode) {
          try { await image.decode(); } catch (_) { /* Broken images still release the queue. */ }
        } else if (!image.complete) {
          await new Promise(resolve => {
            image.addEventListener('load', resolve, {once: true});
            image.addEventListener('error', resolve, {once: true});
          });
        }
      }
      if (target !== requested) {
        busy = false;
        process();
        return;
      }
      const outgoing = slides[current];
      outgoing.classList.add('is-leaving');
      current = target;
      updateState();
      if (reducedMotion.matches) {
        outgoing.classList.remove('is-leaving');
        busy = false;
        process();
        return;
      }
      // Only two layers participate in each fade; later requests are coalesced.
      window.setTimeout(() => {
        outgoing.classList.remove('is-leaving');
        busy = false;
        process();
      }, duration + 20);
    };

    const go = target => {
      requested = normalize(target);
      process();
    };
    root.querySelector(config.prev)?.addEventListener('click', () => go(requested - 1));
    root.querySelector(config.next)?.addEventListener('click', () => go(requested + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
    root.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      go(requested + (event.key === 'ArrowRight' ? 1 : -1));
    });
    root.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      touchStart = touch ? {x: touch.clientX, y: touch.clientY} : null;
    }, {passive: true});
    root.addEventListener('touchend', event => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = (touch?.clientX ?? touchStart.x) - touchStart.x;
      const dy = (touch?.clientY ?? touchStart.y) - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) go(requested + (dx < 0 ? 1 : -1));
    }, {passive: true});

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncHeight);
    for (const slide of slides) {
      const image = slide.querySelector('img');
      if (!image) continue;
      image.addEventListener('load', syncHeight);
      observer?.observe(image);
    }
    window.addEventListener('resize', syncHeight);
    mobile.addEventListener?.('change', syncHeight);
    updateState();
    const activate = () => {
      syncHeight();
      root.classList.add('is-crossfade-ready');
      syncHeight();
    };
    const firstImage = slides[0].querySelector('img');
    if (firstImage) {
      firstImage.loading = 'eager';
      if (firstImage.complete) activate();
      else {
        firstImage.addEventListener('load', activate, {once: true});
        firstImage.addEventListener('error', activate, {once: true});
      }
    } else activate();
  }
})();
