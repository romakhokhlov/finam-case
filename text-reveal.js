(() => {
  // ONDO-style line reveal. All selectors refer to plain-text headings / paragraphs.
  // Never touch artwork, carousel slides, controls or layout sections.
  const selectors = [
    '#case-intro h1', '#case-intro .lead', '#case-intro .body-text',
    '#insights > .section-title', '#insight-grid .info-card h3', '#insight-grid .info-card p',
    '#key-visual-copy h2', '#key-visual-copy p',
    '#modular-copy h2', '#modular-copy p',
    '#components > .feature-copy h2', '#components > .feature-copy p',
    '#page-examples > .feature-copy h2', '#page-examples > .feature-copy p',
    '#results-intro h2', '#results-intro p',
    '#results-grid .stat-card strong', '#results-grid .stat-card p',
  ];
  const texts = [...document.querySelectorAll(selectors.join(','))]
    .filter(element => element.childElementCount === 0 && element.textContent.trim())
    .map(element => ({element, source: element.textContent, shown: false}));
  if (!texts.length || !('IntersectionObserver' in window)) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let observer = null;
  let resizeTimer = 0;
  let initialized = false;

  function restore() {
    observer?.disconnect();
    observer = null;
    document.documentElement.classList.remove('has-text-reveal');
    for (const {element, source} of texts) {
      element.replaceChildren(document.createTextNode(source));
      element.classList.remove('text-reveal-ready', 'text-reveal-visible');
    }
    initialized = false;
  }

  function splitByRenderedLines(item) {
    const {element, source} = item;
    element.replaceChildren();
    const tokens = source.match(/\S+\s*|\s+/gu) || [source];
    const probe = document.createDocumentFragment();
    const pieces = tokens.map(token => {
      const span = document.createElement('span');
      span.textContent = token;
      probe.append(span);
      return span;
    });
    element.append(probe);

    const lines = [];
    let lineTop = null;
    for (let index = 0; index < pieces.length; index++) {
      const rect = pieces[index].getClientRects()[0];
      const top = rect ? rect.top : lineTop;
      if (lineTop === null || (top !== null && Math.abs(top - lineTop) > 2)) {
        lines.push('');
        lineTop = top;
      }
      lines[lines.length - 1] += tokens[index];
    }

    const fragment = document.createDocumentFragment();
    lines.forEach((line, index) => {
      const clip = document.createElement('span');
      clip.className = 'text-reveal-line';
      const inner = document.createElement('span');
      inner.className = 'text-reveal-line-inner';
      inner.style.setProperty('--reveal-order', index);
      inner.textContent = line;
      clip.append(inner);
      fragment.append(clip);
    });
    element.replaceChildren(fragment);
    // Text must be byte-for-byte identical to the source, including spaces.
    if (element.textContent !== source) {
      element.replaceChildren(document.createTextNode(source));
      return false;
    }
    element.classList.add('text-reveal-ready');
    return true;
  }

  function prepare() {
    if (reduceMotion.matches) { restore(); return; }
    observer?.disconnect();
    document.documentElement.classList.remove('has-text-reveal');
    const prepared = [];
    for (const item of texts) {
      item.element.replaceChildren(document.createTextNode(item.source));
      if (splitByRenderedLines(item)) prepared.push(item);
    }

    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('text-reveal-visible');
        const item = texts.find(candidate => candidate.element === entry.target);
        if (item) item.shown = true;
        observer.unobserve(entry.target);
      }
    }, {rootMargin: '0px 0px -12% 0px', threshold: 0.05});

    for (const item of prepared) {
      // Never flash already-visible content back to hidden on first init / resize.
      const rect = item.element.getBoundingClientRect();
      if (item.shown || (rect.top < innerHeight * 0.72 && rect.bottom > 0)) {
        item.element.classList.add('text-reveal-visible');
        item.shown = true;
      } else {
        item.element.classList.remove('text-reveal-visible');
        observer.observe(item.element);
      }
    }
    document.documentElement.classList.add('has-text-reveal');
    initialized = true;
  }

  function onResize() {
    if (!initialized || reduceMotion.matches) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(prepare, 120);
  }
  window.addEventListener('resize', onResize, {passive:true});
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', prepare);
  else reduceMotion.addListener?.(prepare);
  // Wait until web fonts settle so line grouping matches the rendered line breaks.
  if (document.fonts?.ready) document.fonts.ready.then(prepare);
  else prepare();
})();
