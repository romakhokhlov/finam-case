(() => {
  // Zero DOM/CSS changes unless the explicit debug URL parameter is present.
  if (new URLSearchParams(location.search).get('debug') !== 'blocks') return;

  const style = document.createElement('style');
  style.textContent = [
    '#block-debug-overlay{position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden;font:11px/1.25 monospace}',
    '.block-debug-outline{position:absolute;box-sizing:border-box;border:1px solid rgba(0,220,255,.75);pointer-events:none}',
    '.block-debug-outline.is-section{border:2px solid rgba(255,184,0,.9)}',
    '.block-debug-label{position:absolute;top:0;left:0;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:3px 5px;color:#080b13;background:#75efff;border:0;border-radius:0 0 4px 0;cursor:copy;pointer-events:auto;font:11px/1.25 monospace}',
    '.block-debug-outline.is-section>.block-debug-label{background:#ffc85c}',
    '#block-debug-toast{position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#15131a;color:#fff;padding:9px 12px;border:1px solid #75efff;border-radius:6px;pointer-events:none;font:12px/1.4 monospace}',
    '#block-debug-toast[hidden]{display:none}'
  ].join('\n');
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'block-debug-overlay';
  overlay.setAttribute('aria-label', 'Block identification overlay');
  document.body.appendChild(overlay);
  const toast = document.createElement('div');
  toast.id = 'block-debug-toast';
  toast.hidden = true;
  document.body.appendChild(toast);

  const nodes = Array.from(document.querySelectorAll('[id]')).filter(el =>
    el !== overlay && el !== toast && el.id !== 'top' &&
    !el.closest('#block-debug-overlay') &&
    !el.closest('#block-debug-toast') &&
    (el.matches('section,header') || el.closest('main,header'))
  );
  const entries = nodes.map(element => {
    const outline = document.createElement('div');
    outline.className = 'block-debug-outline' + (element.matches('section,header') ? ' is-section' : '');
    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'block-debug-label';
    label.textContent = '#' + element.id;
    label.title = 'Copy #' + element.id;
    label.setAttribute('aria-label', 'Copy block ID ' + element.id);
    outline.appendChild(label);
    overlay.appendChild(outline);
    label.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      copy(element.id);
    });
    return {element,outline,label};
  });

  let toastTimeout;
  function notify(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.hidden = true; }, 1700);
  }
  async function copy(id) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
      } else {
        const input = document.createElement('textarea');
        input.value = id;
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.select();
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
        input.remove();
      }
      notify('Copied: ' + id);
    } catch {
      notify('Copy unavailable: ' + id);
    }
  }

  // Draw in a fixed, non-layout overlay; outlines do not change dimensions.
  let scheduled = false;
  function render() {
    scheduled = false;
    const vw = window.innerWidth, vh = window.innerHeight;
    for (const {element,outline,label} of entries) {
      const rect = element.getBoundingClientRect();
      const x = Math.max(0,rect.left), y = Math.max(0,rect.top);
      const right = Math.min(vw,rect.right), bottom = Math.min(vh,rect.bottom);
      const visible = rect.width > 0 && rect.height > 0 && right > x && bottom > y;
      outline.style.display = visible ? 'block' : 'none';
      if (!visible) continue;
      outline.style.left = x + 'px';
      outline.style.top = y + 'px';
      outline.style.width = (right-x) + 'px';
      outline.style.height = (bottom-y) + 'px';
      // Label is hidden for very small elements to avoid covering them.
      label.style.display = (right-x < 45 || bottom-y < 14) ? 'none' : 'block';
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule,{once:true});
  document.fonts?.ready?.then(schedule);
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
  if (observer) nodes.forEach(node => observer.observe(node));

  // In debug mode only, a click anywhere inside a tagged element copies its
  // closest ID. Prevent navigation or other site actions during inspection.
  document.addEventListener('click', event => {
    if (event.target.closest('#block-debug-overlay')) return;
    const target = event.target.closest('[id]');
    const tagged = target && nodes.includes(target) ? target : event.target.closest('main [id],header [id]');
    if (!tagged || !nodes.includes(tagged)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    copy(tagged.id);
  },true);
  schedule();
})();
