import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const config = JSON.parse(await fs.readFile('key-visual-carousel.json', 'utf8'));
const token = process.env.FIGMA_TOKEN;
if (!token) throw new Error('FIGMA_TOKEN repository secret is required');
if (config.targetHtmlId !== 'key-visual-media') throw new Error('Unexpected target section');
if (!Array.isArray(config.frames) || config.frames.length !== 6) throw new Error('Exactly six Figma frames required');
if (new Set(config.frames.map(frame => frame.id)).size !== config.frames.length) throw new Error('Duplicate Figma node IDs');
if (new Set(config.frames.map(frame => frame.name)).size !== config.frames.length) throw new Error('Duplicate asset names');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function requestJSON(apiPath) {
  for (let attempt = 0; attempt < 7; attempt++) {
    const response = await fetch('https://api.figma.com/v1' + apiPath, {
      headers: {'X-Figma-Token': token}
    });
    if (response.status === 429 || response.status >= 500) {
      if (attempt === 6) throw new Error('Figma API failed after retry: ' + response.status);
      const retrySeconds = Number(response.headers.get('retry-after'));
      await sleep(Number.isFinite(retrySeconds) && retrySeconds > 0
        ? Math.min(retrySeconds * 1000, 180000)
        : Math.min(6000 * (2 ** attempt), 120000));
      continue;
    }
    if (!response.ok) throw new Error('Figma API HTTP ' + response.status + ': ' + (await response.text()).slice(0, 500));
    const data = await response.json();
    if (data.err || data.error) throw new Error('Figma API returned an error: ' + JSON.stringify(data).slice(0, 500));
    return data;
  }
}
async function download(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url);
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (!(response.status === 429 || response.status >= 500) || attempt === 4) {
      throw new Error('Figma rendered image download failed: ' + response.status);
    }
    await sleep(1500 * (2 ** attempt));
  }
}

const ids = config.frames.map(frame => frame.id);
const nodes = await requestJSON('/files/' + config.fileKey + '/nodes?ids=' + encodeURIComponent(ids.join(',')));
for (const item of config.frames) {
  const node = nodes.nodes?.[item.id]?.document;
  if (!node || node.type !== 'FRAME') throw new Error('Target is not an individual Figma FRAME: ' + item.id);
  const w = node.absoluteBoundingBox?.width ?? node.size?.x;
  const h = node.absoluteBoundingBox?.height ?? node.size?.y;
  if (!(w > 0 && h > 0)) throw new Error('Invalid Figma frame dimensions: ' + item.id);
}

const render = await requestJSON('/images/' + config.fileKey + '?ids=' + encodeURIComponent(ids.join(',')) + '&format=png&scale=2');
const results = [];
const binaryFiles = new Map();

for (const item of config.frames) {
  const url = render.images?.[item.id];
  if (!url) throw new Error('Figma did not render frame ' + item.id);
  const input = await download(url);
  const inputInfo = await sharp(input).metadata();
  if (!inputInfo.width || !inputInfo.height) throw new Error('Cannot read PNG dimensions: ' + item.name);
  const optimized = await sharp(input).rotate()
    .resize({width: config.maximumPixelWidth ?? 1660, withoutEnlargement: true})
    .webp({quality: config.quality ?? 84, effort: 6, alphaQuality: 100})
    .toBuffer({resolveWithObject: true});
  if (optimized.info.width > (config.maximumPixelWidth ?? 1660)) throw new Error('Retina width limit exceeded');
  const inputRatio = inputInfo.width / inputInfo.height;
  const outputRatio = optimized.info.width / optimized.info.height;
  if (Math.abs(inputRatio - outputRatio) > .005) throw new Error('Aspect ratio changed: ' + item.name);
  const filename = item.name + '.webp';
  binaryFiles.set(filename, optimized.data);
  results.push({
    filename, figmaId: item.id, width: optimized.info.width, height: optimized.info.height,
    originalPNGBytes: input.length, optimizedWebPBytes: optimized.data.length
  });
}

const htmlPath = 'index.html';
let html = await fs.readFile(htmlPath, 'utf8');
const startToken = '<div id="key-visual-media" ';
const startIndex = html.indexOf(startToken);
const endIndex = html.indexOf('\n</section>', startIndex);
if (startIndex < 0 || endIndex < 0 || html.indexOf(startToken, startIndex + 1) !== -1) {
  throw new Error('Cannot safely locate the sole key-visual-media container');
}

const slides = results.map((item, index) =>
  '<div id="key-visual-slide-' + (index + 1) + '" class="key-visual-slide" role="group" aria-roledescription="slide" aria-label="' + (index + 1) + ' of ' + results.length + '">' +
  '<img id="key-visual-image-' + (index + 1) + '" src="assets/' + item.filename + '" alt="Finam key visual screen ' + (index + 1) + '" loading="lazy" decoding="async" width="' + item.width + '" height="' + item.height + '"/></div>'
).join('\n');
const dots = results.map((item, index) =>
  '<button type="button" class="key-visual-dot' + (index === 0 ? ' is-current' : '') + '" aria-label="Go to slide ' + (index + 1) + '"' + (index === 0 ? ' aria-current="true"' : '') + '></button>'
).join('\n');
const markup = [
  '<div id="key-visual-media" class="media-frame standard-media visual-media full-bleed">',
  '<div class="media-artboard">',
  '<div id="key-visual-carousel" class="key-visual-carousel" role="region" aria-roledescription="carousel" aria-label="Key visual gallery" tabindex="0">',
  '<div id="key-visual-carousel-viewport" class="key-visual-carousel-viewport">',
  '<div id="key-visual-carousel-track" class="key-visual-carousel-track">',
  slides,
  '</div></div>',
  '<button type="button" class="key-visual-control key-visual-prev" aria-label="Previous slide">‹</button>',
  '<button type="button" class="key-visual-control key-visual-next" aria-label="Next slide">›</button>',
  '<div id="key-visual-pagination" class="key-visual-pagination" aria-label="Slide navigation">',
  dots,
  '</div></div></div></div>'
].join('\n');
html = html.slice(0, startIndex) + markup + html.slice(endIndex);
if (!html.includes('src="key-visual-carousel.js"')) throw new Error('Carousel controls script must be included before export');
if ((html.match(/class="key-visual-slide"/g) || []).length !== config.frames.length) throw new Error('Wrong slide count');

const assetDir = 'assets';
await fs.mkdir(assetDir, {recursive: true});
for (const [filename, bytes] of binaryFiles) await fs.writeFile(path.join(assetDir, filename), bytes);
await fs.writeFile(htmlPath, html);

const keep = new Set(binaryFiles.keys());
for (const filename of await fs.readdir(assetDir)) {
  if (/^key-visual-slide-\d+\.webp$/i.test(filename) && !keep.has(filename)) {
    await fs.unlink(path.join(assetDir, filename));
  }
}
if (!html.includes('assets/image-31.webp')) {
  // The original stand-alone Key Visual image is no longer used.
  const css = await fs.readFile('styles.css', 'utf8');
  if (!css.includes('assets/image-31.webp')) {
    await fs.rm(path.join(assetDir, 'image-31.webp'), {force: true});
  }
}

const before = results.reduce((total, file) => total + file.originalPNGBytes, 0);
const after = results.reduce((total, file) => total + file.optimizedWebPBytes, 0);
let report = '# Key Visual Figma carousel export\n\n';
report += '- Figma file: ' + config.fileKey + '\n- Source section: ' + config.sourceSectionId + '\n';
report += '- Target: #' + config.targetHtmlId + '\n- Frames: ' + results.length + '\n';
report += '- Rendered PNG total: ' + before + ' bytes\n- Optimized WebP total: ' + after + ' bytes\n';
report += '- Reduction: ' + (100 * (1 - after / before)).toFixed(1) + '%\n';
report += '- Method: individually rendered Figma child frames (not the containing section), preserving each frame composition\n\n';
report += '| File | Figma ID | Dimensions | PNG (bytes) | WebP (bytes) |\n|---|---|---:|---:|---:|\n';
for (const item of results) report += '| ' + item.filename + ' | ' + item.figmaId + ' | ' + item.width + '×' + item.height + ' | ' + item.originalPNGBytes + ' | ' + item.optimizedWebPBytes + ' |\n';
await fs.writeFile('KEY-VISUAL-EXPORT-REPORT.md', report);
console.log(report);
