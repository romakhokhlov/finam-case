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
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(5000 * 2 ** attempt, 120000)));
      continue;
    }
    if (!response.ok) throw new Error('Figma API ' + response.status + ': ' + (await response.text()).slice(0, 500));
    return response.json();
  }
}

const all = [...(spec.slides || []), ...(spec.hero || [])];
if (!all.length) throw new Error('No Figma exports configured');
const rendered = await figma('/images/' + spec.fileKey + '?ids=' + encodeURIComponent(all.map((item) => item.nodeId).join(',')) + '&format=png&scale=2');
const results = [];
for (const item of all) {
  const url = rendered.images?.[item.nodeId];
  if (!url) throw new Error('Missing render for ' + item.nodeId);
  const input = Buffer.from(await (await fetch(url)).arrayBuffer());
  const output = await sharp(input).rotate().resize({ width: item.maxWidth, withoutEnlargement: true }).webp({ quality: item.quality || 84, effort: 6, alphaQuality: 100 }).toBuffer();
  const filename = item.name + '.webp';
  await fs.writeFile(path.join(outDir, filename), output);
  results.push({ ...item, filename, before: input.length, after: output.length });
}

let html = await fs.readFile('index.html', 'utf8');
const slides = results.filter((item) => item.name.startsWith('modular-slide-'));
const slideMarkup = '<div id="modular-carousel-track" class="modular-carousel-track">' + slides.map((item, index) => '<div class="modular-slide" id="modular-slide-' + (index + 1) + '" role="group" aria-label="' + (index + 1) + ' of ' + slides.length + '"><img src="assets/' + item.filename + '" alt="Modular Block System layout ' + (index + 1) + '" loading="lazy"></div>').join('') + '</div>';
html = html.replace(/<!-- MODULAR_SLIDES -->[\s\S]*?<!-- \/MODULAR_SLIDES -->/, '<!-- MODULAR_SLIDES -->' + slideMarkup + '<!-- /MODULAR_SLIDES -->');
html = html.replace(/(<div id="hero-image-left"[^>]*><img[^>]*src=")[^"]+/, '$1assets/hero-demo-left.webp');
html = html.replace(/(<div id="hero-image-right"[^>]*><img[^>]*src=")[^"]+/, '$1assets/hero-demo-right.webp');
await fs.writeFile('index.html', html);

const keep = new Set(results.map((item) => item.filename));
for (const file of await fs.readdir(outDir)) if (/^(modular-slide-|hero-demo-).*\.webp$/i.test(file) && !keep.has(file)) await fs.unlink(path.join(outDir, file));
const before = results.reduce((sum, item) => sum + item.before, 0);
const after = results.reduce((sum, item) => sum + item.after, 0);
await fs.writeFile('ASSET-REPORT.md', '# Figma image export\n\n- Source file: ' + spec.fileKey + '\n- Hero images: ' + (spec.hero || []).length + '\n- Modular slides: ' + slides.length + '\n- PNG input: ' + before + ' bytes\n- WebP output: ' + after + ' bytes\n- Reduction: ' + (100 * (1 - after / before)).toFixed(1) + '%\n');
console.log('Exported ' + results.length + ' images: ' + after + ' bytes');
