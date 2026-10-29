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
