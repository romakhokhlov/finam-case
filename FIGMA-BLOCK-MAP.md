# Finam — HTML ↔ Figma mapping

Source: Figma file `nCV6hHOEJCYoKib0o0MP5O`, page `2301:627`, root `2301:628`.

All HTML targets are in `index.html`. CSS: `styles.css`. Inspector: `debug-blocks.js`. IDs refer to site elements; parent Figma IDs for containers/cards are *approximate mappings* when no one-to-one frame was verified.

| Element | HTML ID | GitHub file | Figma Node ID |
|---|---|---|---|
| Header / portfolio link | `#site-header` | `index.html` | `2301:628` |
| Portfolio star | `#portfolio-home-link` | `index.html` | `2301:631` |
| Finam intro | `#case-intro` | `index.html` | `2301:633` |
| Finam title | `#case-title` | `index.html` | `2301:634` |
| Intro copy container | `#intro-copy` | `index.html` | `2301:635` |
| Intro headline | `#intro-lead` | `index.html` | `2301:636` |
| Hero showcase | `#hero-showcase` | `index.html` | `2304:1991` |
| Hero image group | `#hero-artboard` | `index.html` | `2401:2235` |
| Hero left image | `#hero-image-left` | `index.html` | `2401:2233` |
| Hero right image | `#hero-image-right` | `index.html` | `2401:2228` |
| Insights | `#insights` | `index.html` | `2301:644` |
| Insights heading | `#insights-title` | `index.html` | `2301:646` |
| Insights cards container | `#insight-grid` | `index.html` | `2301:648` |
| Visual style insight | `#insight-card-visual-style` | `index.html` | `2301:648` |
| Hierarchy insight | `#insight-card-hierarchy` | `index.html` | `2301:648` |
| Emotional insight | `#insight-card-emotion` | `index.html` | `2301:648` |
| Key visual | `#key-visual` | `index.html` | `2336:2023` |
| Key visual heading | `#visual-title` | `index.html` | `2301:656` |
| Key visual copy | `#key-visual-copy` | `index.html` | `2301:654` |
| Key visual artwork container | `#key-visual-media` | `index.html` | `2304:2007` |
| Key visual image | `#key-visual-image` | `index.html` | `2333:12271` |
| Modular Block System | `#modular-block-system` | `index.html` | `2343:1975` |
| Modular heading | `#block-title` | `index.html` | `2301:664` |
| Modular copy | `#modular-copy` | `index.html` | `2301:662` |
| Modular artwork container | `#modular-media` | `index.html` | `2334:2010` |
| Modular image | `#modular-image` | `index.html` | `2401:2239` |
| Components | `#components` | `index.html` | `2336:2024` |
| Components heading | `#components-title` | `index.html` | `2336:2028` |
| Components copy | `#components-copy` | `index.html` | `2336:2026` |
| Components artwork container | `#components-media` | `index.html` | `2336:2031` |
| Page examples | `#page-examples` | `index.html` | `2343:1976` |
| Page examples heading | `#examples-title` | `index.html` | `2343:1979` |
| Page examples copy | `#examples-copy` | `index.html` | `2343:1977` |
| Examples artwork | `#examples-media` | `index.html` | `2344:2011` |
| Examples grid | `#examples-stack` | `index.html` | `2344:2011` |
| Example row 1 | `#examples-row-one` | `index.html` | `2344:2011` |
| Example row 2 | `#examples-row-two` | `index.html` | `2344:2011` |
| Example row 3 | `#examples-row-three` | `index.html` | `2344:2011` |
| Page example 1 | `#example-image-one` | `index.html` | `2422:4224` |
| Page example 2 | `#example-image-two` | `index.html` | `2422:4225` |
| Page example 3 | `#example-image-three` | `index.html` | `2425:4249` |
| Page example 4 | `#example-image-four` | `index.html` | `2425:4251` |
| Page example 5 | `#example-image-five` | `index.html` | `2423:4230` |
| Page example 6 | `#example-image-six` | `index.html` | `2424:4238` |
| Results | `#results` | `index.html` | `2301:801` |
| Results heading | `#results-title` | `index.html` | `2301:805` |
| Results copy | `#results-intro` | `index.html` | `2301:803` |
| Results metrics grid | `#results-grid` | `index.html` | `2301:801` |

To inspect the site, open `https://finam-case.pages.dev/?debug=blocks`. Click a labeled block to copy its ID. Without the query parameter the inspector does not run.

## Modular carousel — new Figma source

Source file: `zG9GLaQaUXOhPeZC9VOBmx`; section `4308:3229`.

| Site ID | GitHub file | Figma node |
|---|---|---|
| `#modular-media` | `index.html` | `4308:3229` |
| `#modular-carousel` | `index.html` | `4308:3229` |
| `#modular-carousel-viewport` | `index.html` | `4308:3229` |
| `#modular-carousel-track` | `index.html` | `4308:3229` |
| `#modular-image-38` | `index.html` | `4308:3230` |
| `#modular-image-39` | `index.html` | `4308:3231` |
| `#modular-image-40` | `index.html` | `4308:3232` |
| `#modular-image-41` | `index.html` | `4308:3233` |
| `#modular-image-45` | `index.html` | `4308:3234` |

Carousel behavior: `modular-carousel.js`. Carousel styling: `styles.css`.

## Key Visual carousel (Figma Section 6)

Figma source: `zG9GLaQaUXOhPeZC9VOBmx`, section `4330:6979`.
Slides ordered top-to-bottom, left-to-right in the source gallery. Target: `#key-visual-media`.

| HTML ID | Figma node ID | Asset |
|---|---|---|
| `#key-visual-slide-1` / `#key-visual-image-1` | `4330:5948` | `assets/key-visual-slide-01.webp` |
| `#key-visual-slide-2` / `#key-visual-image-2` | `4330:5973` | `assets/key-visual-slide-02.webp` |
| `#key-visual-slide-3` / `#key-visual-image-3` | `4330:5902` | `assets/key-visual-slide-03.webp` |
| `#key-visual-slide-4` / `#key-visual-image-4` | `4330:5925` | `assets/key-visual-slide-04.webp` |
| `#key-visual-slide-5` / `#key-visual-image-5` | `4330:6019` | `assets/key-visual-slide-05.webp` |
| `#key-visual-slide-6` / `#key-visual-image-6` | `4330:5996` | `assets/key-visual-slide-06.webp` |

Carousel controls: `key-visual-carousel.js`. Styling: `styles.css`. Automated export: `scripts/sync-key-visual-carousel.mjs`, `key-visual-carousel.json`.

## Components carousel — source Section 7

Figma: `zG9GLaQaUXOhPeZC9VOBmx`, `4337:12973`.
Order follows original artboard layout: tall left frame, upper right frame, lower right frame. Only `#components-media` is replaced; the section heading and copy are preserved.

| HTML ID | GitHub file | Figma Node ID | Asset |
|---|---|---|---|
| `#components-media` | `index.html` | `4337:12973` | Carousel container |
| `#components-carousel` | `index.html` | `4337:12973` | Carousel region |
| `#components-carousel-track` | `index.html` | `4337:12973` | Slider track |
| `#components-slide-1` / `#components-image-1` | `index.html` | `4343:12974` | `components-slide-01.webp` |
| `#components-slide-2` / `#components-image-2` | `index.html` | `4337:9058` | `components-slide-02.webp` |
| `#components-slide-3` / `#components-image-3` | `index.html` | `4327:5812` | `components-slide-03.webp` |

Controls: `components-carousel.js`. Styles: `styles.css`. Export automation: `components-carousel.json`, `scripts/sync-components-carousel.mjs`, `.github/workflows/sync-components-carousel.yml`.
