import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const spec = JSON.parse(await fs.readFile('figma-assets.json', 'utf8'));
const token = process.env.FIGMA_TOKEN;
if (!token) throw new Error('Missing FIGMA_TOKEN');
const outDir = path.resolve('assets');
await fs.mkdir(outDir, { recursive: true });

async function figma(endpoint) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch('https://api.figma.com/v1' + endpoint, { headers: { 'X-Figma-Token': token } });
    if (response.status === 429 || response.status >= 500) {
      if (attempt === 5) throw new Error('Figma API ' + response.status);
      const retryAfter = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(5000 * 2 ** attempt, 120000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (!response.ok) throw new Error('Figma API ' + response.status + ': ' + (await response.text()).slice(0, 500));
    return response.json();
  }
}

const slides = spec.slides || [];
if (!slides.length) throw new Error('No slides configured');
const imageMap = await figma('/images/' + spec.fileKey + '?ids=' + encodeURIComponent(slides.map((slide) => slide.nodeId).join(',')) + '&format=png&scale=2');
const results = [];

for (const slide of slides) {
  const url = imageMap.images?.[slide.nodeId];
  if (!url) throw new Error('Missing render for ' + slide.nodeId);
  const input = Buffer.from(await (await fetch(url)).arrayBuffer());
  const image = sharp(input, { animated: false }).rotate();
  const meta = await image.metadata();
  const output = await image
    .resize({ width: slide.maxWidth, withoutEnlargement: true })
    .webp({ quality: slide.quality || 84, effort: 6, alphaQuality: 100 })
    .toBuffer();
  const filename = slide.name + '.webp';
  await fs.writeFile(path.join(outDir, filename), output);
  results.push({ filename, nodeId: slide.nodeId, width: meta.width, height: meta.height, before: input.length, after: output.length });
}

const htmlPath = 'index.html';
let html = await fs.readFile(htmlPath, 'utf8');
const markup = '<div id="modular-carousel-track" class="modular-carousel-track">' +
  results.map((item, index) => '<div class="modular-slide" id="modular-slide-' + (index + 1) + '" role="group" aria-label="' + (index + 1) + ' of ' + results.length + '"><img src="assets/' + item.filename + '" alt="Modular Block System layout ' + (index + 1) + '" loading="lazy"></div>').join('') +
  '</div>';
html = html.replace(/<!-- MODULAR_SLIDES -->[\s\S]*?<!-- \/MODULAR_SLIDES -->/, '<!-- MODULAR_SLIDES -->' + markup + '<!-- /MODULAR_SLIDES -->');
await fs.writeFile(htmlPath, html);

const keep = new Set(results.map((item) => item.filename));
for (const file of await fs.readdir(outDir)) {
  if (/^modular-slide-.*\.webp$/i.test(file) && !keep.has(file)) await fs.unlink(path.join(outDir, file));
}
const before = results.reduce((sum, item) => sum + item.before, 0);
const after = results.reduce((sum, item) => sum + item.after, 0);
await fs.writeFile('ASSET-REPORT.md', '# Figma modular carousel export\n\n- Source section: 4315:62167\n- Slides: ' + results.length + '\n- PNG input: ' + before + ' bytes\n- WebP output: ' + after + ' bytes\n- Reduction: ' + (100 * (1 - after / before)).toFixed(1) + '%\n');
console.log('Exported ' + results.length + ' modular slides: ' + after + ' bytes');
