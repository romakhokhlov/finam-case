# Finam portfolio — agent instructions

These rules apply to all changes in this repository. Read this file and inspect the current implementation before editing.

## Existing code is the source of truth

- Reuse approved HTML structures, selectors, and responsive rules instead of inventing new equivalents.
- Before building a repeated section, identify the corresponding reference element and inspect all relevant rules in `index.html` and `styles.css`, including later media-query overrides and CSS cascade.
- Keep approved reference elements unchanged unless the task explicitly requests modifying the reference itself.
- For a new instance, change content and assets only where possible; retain structure and spacing. If variation is necessary, use a narrowly scoped modifier, not a global override that silently changes other sections.
- Preserve the existing visual behavior on desktop and mobile. Do not infer CSS values from screenshots when the actual rules are available.
- If a proposed new layout does not match a registered reference, report the difference or follow the user's explicit new design instead of silently substituting another component.

## Reference component registry

### INFO-CARD-INSIGHTS — informational card group

- **Reference card:** `#insight-card-visual-style` inside `#insights` in `index.html`.
- **Reference group:** `#insight-grid` / `.insight-grid`.
- **Reference card class:** `.info-card`.
- **Use for:** groups of informational cards with a heading and descriptive text, especially when copying the visual rhythm of the Insights section.
- **Primary invariant:** card padding on every side, inter-card gap, and resulting layout across responsive breakpoints.
- **Source of truth:** current selectors and their final cascade in `styles.css`; the following values are a baseline snapshot and must be checked against the current file before modifying or copying.

| Viewport | Card padding | Gap between cards | Layout | Radius | Min height |
| --- | --- | --- | --- | --- | --- |
| Desktop, above 1100px | `24px` | `24px` | 3 equal columns | `20px` | `220px` |
| Intermediate, 768–1100px | `24px` | `24px` | 3 equal columns | `20px` | `220px` |
| Mobile, up to 767px | `6.25vw` each side (20px at 320px viewport) | `4.375vw` (14px at 320px viewport) | stacked, single column | `16px` | content-driven (`0`) |

- Mobile overrides defined **later** in `styles.css` override earlier `.info-card{padding:20px}` and `.insight-grid{gap:12px}` declarations. Preserve the *computed* outcome, not just the first matching rule.
- Mobile horizontal page gutter is also `6.25vw` via `--pad`. Keep card **internal padding** distinct from the page's external gutter.
- The reference card's inner structure is `<article class="info-card"><h3>…</h3><p>…</p></article>`. Maintain the existing heading/body spacing when applying the card pattern.
- Reuse `.insight-grid` and `.info-card` where appropriate; if cards in a different section need special styling, scope it without altering the approved Insights set.

## Text punctuation — no final periods

- **Never end a paragraph with a period** anywhere on the Finam page, including introduction, section descriptions, informational cards, and results captions.
- Keep punctuation **between sentences within the same paragraph**. Remove only a final `.` from the paragraph's rendered text; do not rewrite its content or remove sentence-internal periods.
- When adding, translating, or editing text, check **every `<p>` in `index.html`** for trailing periods before publishing, even paragraphs outside the edited section.

### CAROUSEL-COMPONENTS — reference carousel for comparable galleries

- **Canonical implementation:** `#components-carousel` within `#components-media` in `index.html`, its selectors (including final media-query overrides) in `styles.css`, and the shared controller in `components-carousel.js` (also used by `#key-visual-carousel` and `#modular-carousel`).
- **Scope:** use as the structural and behavioral basis for new or explicitly requested changes to comparable image carousels. The canonical carousel and all three existing galleries were explicitly updated to crossfade. Preserve their images, content, intrinsic image proportions, per-section canvas dimensions, and other intentional differences.
- **HTML:** focusable `role="region"` / `aria-roledescription="carousel"`, containing an overflow-hidden viewport, a stacked slide container, previous/next buttons, and one accessible pagination button per slide. New instances must use unique IDs and properly matched selectors/JS; never reuse reference IDs.
- **Slide mechanics:** shared **crossfade** for all analogous galleries: no horizontal translation. Slides are stacked in the same viewport with `position:absolute;inset:0`, and switch simultaneously using `transition: opacity 400ms ease-in-out` in either direction. Incoming slide opacity `0 → 1`, outgoing `1 → 0`. Only the active slide receives pointer events, with the outgoing slide retained underneath until transition completion. Use `object-fit:contain`, never crop; preserve section-specific sizes and proportions. Account for image decode before activation and coalesce rapid input without exposing blank frames.
- **Desktop:** reference viewport width `59.15%` of artboard (specific to Components; do not force onto another section), fills artboard height. Preserve image width, aspect ratio, existing panel height and horizontal positioning. Round controls `40×40px`, centered vertically and inset `3.5%`, arrow font `30px`. Pagination dots are `8px` with `10px` gap; `75px` is the **former** bottom offset, now used only as a baseline for the dynamic spacing calculation.
- **Desktop vertical spacing standard (all slides, >=768px):** visually rendered image top to media-panel top **must equal** pagination bottom to media-panel bottom; image visible bottom to pagination top must be **exactly half the former gap** for the same active slide and viewport. Measure visible alpha bounds, including source transparency and object-fit letterboxing, rather than padding alone. The shared `components-carousel.js` controller sets `--carousel-visual-top` on each slide and `--carousel-pagination-bottom` on the root. CSS applies them only within `@media(min-width:768px)` and `.has-balanced-spacing`. Do not apply these desktop variables on mobile.
- **Reference geometry in px:** old desktop panel height `676px`, original top/bottom slide insets `34px / 108px`, original pagination bottom `75px`, dot height `8px`. With fully opaque imagery, the first slides calculate approximately: Components `66px / 16px / 66px`, Key Visual `73px / 21px / 73px`, Modular `92px / 33px / 92px` (top / image-to-pagination / bottom). These are *reference calculations*, not hardcoded spacing values: actual values depend on each slide's nontransparent pixel bounds and the viewport. Validate actual values in Chromium.
- **No cosmetic regressions:** Do not resize images, change image aspect ratios, horizontal padding, crossfade (`400ms ease-in-out`), image reveal, hover zoom, pagination appearance or mobile layout. Key Visual's original image height limit (`100cqh - 142px`) must remain effective after repositioning. Prefer preserving each panel's existing height rather than forcing new container heights.
- **Mobile (<=767px):** reference viewport width `91%` (section-specific), controls `30×30px`, arrow font `23px`, inset `1%`. **Final** mobile CSS overrides set the media panel to `height:auto;min-height:0;padding-block:34px`, artboard and slides to content height, carousel to relative column layout, images to intrinsic aspect ratio with `object-fit:contain`, and pagination in normal flow `margin-top:25px` (rather than desktop absolute positioning). Observe final cascade instead of copying earlier mobile `height:clamp(...)` declarations.
- **Navigation and accessibility:** previous/next arrows, dots, Left/Right keys, touch swipe with 40px threshold; wrap around; synchronize `is-current`, `aria-current`, and `aria-hidden`. Mobile viewport height follows the active image on load, resize, and slide change; height changes use `400ms ease-in-out` to avoid abrupt jumps. Support differing source aspect ratios. Preserve focus-visible outlines and disable opacity and height transitions for `prefers-reduced-motion:reduce`.
- **Reuse checklist:** inspect the original HTML, the full CSS cascade, and JS before building a similar carousel. Reuse controls, pagination rhythm, stacked-slide crossfade (same in both directions), navigation, and responsive behavior. All new analogous carousels must use this standard and preferably the shared controller, never a separate horizontal scroller. Do not hardcode the reference's 3 images, widths, fixed panel measurements, or identifiers into other carousels.
- **Verification:** compare desktop and mobile computed layout, image containment, controls, dots, swipes, keyboard control, rapid repeated input, simultaneous opacity transitions, absence of horizontal motion, active-slide sizing, and reduced motion. Do not claim visual/runtime verification if unavailable.

## Visual testing — Playwright and Chromium

- For Finam browser verification, use **Playwright + Chromium**, not TinyFish. Run locally when the repository is available; the checked-in `.github/workflows/desktop-carousel-audit.yml` performs the same verification in GitHub Actions.
- Compare desktop carousel spacing and composition at 768, 1024, 1280, 1440 and 1920px, and ensure the 390px mobile layout is unchanged. Use `getBoundingClientRect()`, computed styles and screenshots; distinguish image boxes from visually opaque image content.
- Preserve the canonical Components carousel's shared crossfade controller and hover animation when adjusting desktop-only layout.

## Verification before publishing

1. Read current HTML and CSS and identify all selectors that apply to the component at each breakpoint.
2. Check that the reference component itself has not regressed.
3. Verify desktop and mobile spacing and card grouping; use rendered screenshots when browser/preview access is available.
4. Run the project's existing build or validation command if one exists. Do not fabricate a successful build or visual check when the environment does not support it.
5. Keep edits limited to requested files and avoid unrelated formatting/refactors.

## Concurrent GitHub work

- Use a dedicated clone or worktree for each independent task. Start with `git fetch origin` and inspect current `origin/main`.
- Preserve other agents' commits and uncommitted changes. Stage only task-specific paths; never use indiscriminate `git add .` or `git add -A`.
- After validation, commit only your changes. Before pushing, run `git pull --rebase origin main`; resolve conflicts by preserving both agents' intent, otherwise stop and report the conflict.
- Never use `git push --force`. If push is rejected because main advanced, sync and retry.
- After pushing, confirm the new commit is included in remote `main`.

## Image shadow standard

- Apply this shared shadow to image surfaces that currently use the portfolio image shadow (including `.hero-tile` and `#examples-media .page-shot`).
- Desktop (above 767px): `box-shadow: 0 0 30px rgba(0, 0, 0, 0.25)`.
- Mobile (up to 767px): `box-shadow: 0 0 15px rgba(0, 0, 0, 0.25)`.
- Vertical offset is always `0`; do not introduce a downward shadow offset.
- Images whose shadow is explicitly reset to `box-shadow: none` remain unshadowed unless the task explicitly requests otherwise.
