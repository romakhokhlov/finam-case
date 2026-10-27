import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const config = JSON.parse(await fs.readFile('components-carousel.json', 'utf8'));
const token = process.env.FIGMA_TOKEN;
if (!token) throw new Error('Missing FIGMA_TOKEN repository secret');
if (config.targetHtmlId !== 'components-media' || config.sourceSectionId !== '4337:12973')
  throw new Error('Unexpected Figma section or HTML target');
if (!Array.isArray(config.frames) || config.frames.length !== 3) throw new Error('Expected exactly 3 frames');
if (new Set(config.frames.map(item => item.id)).size !== 3) throw new Error('Duplicate node IDs');
if (new Set(config.frames.map(item => item.name)).size !== 3) throw new Error('Duplicate filenames');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function figma(endpoint) {
  for (let attempt = 0; attempt < 7; attempt++) {
    const response = await fetch('https://api.figma.com/v1' + endpoint, {
      headers: {'X-Figma-Token': token}
    });
    if (response.status === 429 || response.status >= 500) {
      if (attempt === 6) throw new Error('Figma API exhausted retries: ' + response.status);
      const seconds = Number(response.headers.get('retry-after'));
      await sleep(Number.isFinite(seconds) && seconds > 0
        ? Math.min(seconds * 1000, 180000)
        : Math.min(6000 * 2 ** attempt, 120000));
      continue;
    }
    if (!response.ok) throw new Error('Figma API HTTP ' + response.status + ': ' + (await response.text()).slice(0, 500));
    const data = await response.json();
    if (data.err || data.error) throw new Error('Figma API error: ' + JSON.stringify(data).slice(0, 500));
    return data;
  }
}

async function download(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if ((res.status !== 429 && res.status < 500) || attempt === 4)
      throw new Error('Figma image download failed: HTTP ' + res.status);
    await sleep(2000 * 2 ** attempt);
  }
}

const ids = config.frames.map(item => item.id);
const nodes = await figma('/files/' + config.fileKey + '/nodes?ids=' + encodeURIComponent(ids.join(',')));
for (const frame of config.frames) {
  const node = nodes.nodes?.[frame.id]?.document;
  if (!node || node.type !== 'FRAME') throw new Error('Invalid individual component frame ' + frame.id);
  const width = node.absoluteBoundingBox?.width ?? node.size?.x;
  const height = node.absoluteBoundingBox?.height ?? node.size?.y;
  if (!(width > 0 && height > 0)) throw new Error('Invalid frame dimensions ' + frame.id);
}

// Export each named child frame, never its parent Section 7 or adjacent artwork.
const renders = await figma('/images/' + config.fileKey
  + '?ids=' + encodeURIComponent(ids.join(',')) + '&format=png&scale=2');
const binaries = new Map();
const results = [];
for (const item of config.frames) {
  const url = renders.images?.[item.id];
  if (!url) throw new Error('Missing render URL for ' + item.id);
  const input = await download(url);
  const beforeInfo = await sharp(input).metadata();
  if (!beforeInfo.width || !beforeInfo.height) throw new Error('Invalid PNG: ' + item.name);
  const optimized = await sharp(input).rotate()
    .resize({width: config.maximumPixelWidth || 1648, withoutEnlargement: true})
    .webp({quality: config.quality || 84, effort: 6, alphaQuality: 100})
    .toBuffer({resolveWithObject: true});
  const ratioBefore = beforeInfo.width / beforeInfo.height;
  const ratioAfter = optimized.info.width / optimized.info.height;
  if (Math.abs(ratioBefore - ratioAfter) > 0.005) throw new Error('Aspect ratio changed: ' + item.name);
  if (optimized.info.width > config.maximumPixelWidth) throw new Error('Excessive image width: ' + item.name);
  const filename = item.name + '.webp';
  binaries.set(filename, optimized.data);
  results.push({filename, figmaId:item.id, width:optimized.info.width, height:optimized.info.height,
    pngBytes:input.length, webpBytes:optimized.data.length});
}

let html = await fs.readFile('index.html', 'utf8');
const openToken = '<div id="components-media" ';
const start = html.indexOf(openToken);
const end = html.indexOf('\n</section>', start);
if (start < 0 || end < 0 || html.indexOf(openToken, start + 1) !== -1)
  throw new Error('Cannot safely locate unique #components-media markup');
if (!html.includes('<script src="components-carousel.js" defer></script>'))
  throw new Error('Components carousel script is not loaded');

// Preserve the existing section and description, replace only its media container.
const slideMarkup = results.map((item, i) =>
  '<div id="components-slide-' + (i + 1) + '" class="components-slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + results.length + '">'
  + '<img id="components-image-' + (i + 1) + '" alt="Finam reusable components — slide ' + (i + 1)
  + '" src="assets/' + item.filename + '" width="' + item.width + '" height="' + item.height
  + '" loading="lazy" decoding="async"/></div>'
).join('\n');
const dots = results.map((item, i) =>
  '<button type="button" class="components-dot' + (i === 0 ? ' is-current' : '')
  + '" aria-label="Go to slide ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>'
).join('\n');
const markup = [
  '<div id="components-media" class="media-frame standard-media components-media full-bleed">',
  '<div class="media-artboard">',
  '<div id="components-carousel" class="components-carousel" role="region" aria-roledescription="carousel" aria-label="Finam components gallery" tabindex="0">',
  '<div id="components-carousel-viewport" class="components-carousel-viewport">',
  '<div id="components-carousel-track" class="components-carousel-track">',
  slideMarkup,
  '</div></div>',
  '<button class="components-control components-prev" type="button" aria-label="Previous slide">‹</button>',
  '<button class="components-control components-next" type="button" aria-label="Next slide">›</button>',
  '<div id="components-carousel-pagination" class="components-pagination" aria-label="Slide navigation">',
  dots,
  '</div></div></div></div>'
].join('\n');
html = html.slice(0, start) + markup + html.slice(end);
if ((html.match(/class="components-slide"/g) || []).length !== 3)
  throw new Error('Wrong number of generated slide elements');

// Perform all network operations and checks first; write to repo only after success.
const assetDir = 'assets';
await fs.mkdir(assetDir, {recursive:true});
for (const [name, data] of binaries) await fs.writeFile(path.join(assetDir, name), data);
await fs.writeFile('index.html', html);

const keep = new Set(binaries.keys());
for (const name of await fs.readdir(assetDir)) {
  if (/^components-slide-\d+\.webp$/.test(name) && !keep.has(name))
    await fs.unlink(path.join(assetDir, name));
}
const css = await fs.readFile('styles.css','utf8');
for (const oldAsset of ['image-42.webp','image-44.webp']) {
  if (!html.includes('assets/' + oldAsset) && !css.includes('assets/' + oldAsset))
    await fs.rm(path.join(assetDir, oldAsset), {force:true});
}

const inputBytes = results.reduce((acc,x) => acc + x.pngBytes,0);
const outputBytes = results.reduce((acc,x) => acc + x.webpBytes,0);
let report = '# Components Figma carousel export\n\n';
report += '- Figma file: '+config.fileKey+'\n- Source section: '+config.sourceSectionId
  +'\n- Target: #'+config.targetHtmlId+'\n- Frames: '+results.length+'\n';
report += '- Rendered PNG input: '+inputBytes+' bytes\n- WebP output: '+outputBytes+' bytes\n';
report += '- Reduction: '+(100*(1-outputBytes/inputBytes)).toFixed(1)+'%\n';
report += '- Every exported asset is an individual Figma frame; no section-wide screenshot\n\n';
report += '| File | Figma Node ID | Dimensions | PNG bytes | WebP bytes |\n|---|---|---|---:|---:|\n';
for (const item of results) {
  report += '| '+item.filename+' | '+item.figmaId+' | '+item.width+'×'+item.height+' | '+item.pngBytes+' | '+item.webpBytes+' |\n';
}
await fs.writeFile('COMPONENTS-EXPORT-REPORT.md', report);
console.log(report);
