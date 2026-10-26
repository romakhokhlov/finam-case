# Finam — portfolio case

Source: the latest user-supplied `finam-typography-spacing-updated(1).zip`.

## Status
The responsive HTML/CSS/JavaScript from the supplied archive is committed.
**Original images are not included yet:** the supplied ZIP contains no `site/assets` folder. The site will have missing graphics until these files are added under `assets/`.

## Required assets
```
assets/
  image-36.png
  image-37.png
  image-31.png
  image-42.png
  image-44.png
  image-49.png
  image-50.png
  image-46.png
  image-48.png
  image-67.png
  image-69.png
  modular-38.png
  modular-40.png
  modular-45.png
  modular-41.png
  modular-39.png
  frame-gradient.svg
```

These are the exact relative paths referenced by index.html and styles.css. A separate unused `image-38.png` was named by an older script but is not required by this version.

## Cloudflare Pages
Connect this GitHub repository to Cloudflare Pages (Workers & Pages → Create application → Pages → Connect to Git). Use:
- Production branch: `main`
- Framework preset: **None**
- Build command: leave empty
- Build output directory: `/` (repository root)

The code is a static site; no build step, paid hosting, GitHub Actions or Node.js required. Every push to main should trigger a new deployment once Git integration is configured.

**Do not consider the website finished until the image assets are uploaded and verified.**

## Workflow
Edit source files in GitHub and commit changes → Cloudflare rebuilds automatically. For new Figma graphics, export PNG/SVG/WebP and add or replace the corresponding file under `assets/`. No ongoing Figma URL dependency is needed.

The CSS star rotation currently uses 10 seconds per turn; the precise reference duration was not measured.
