# Finam — automated Figma → GitHub → Cloudflare

This repository contains the Finam portfolio site and an **automated image-export workflow**.

## How it works

1. GitHub Actions reads exact Figma layer IDs from `figma-assets.json`.
2. It retrieves **each individual image-bearing layer** via the Figma REST API; it does NOT export parent frames.
3. Sharp converts the PNG render to WebP (quality 84) with native alpha preserved, keeping proportionate dimensions and limiting to 2× displayed size.
4. The action updates `index.html`, `styles.css`, checks all image paths and deletes older raster files.
5. It commits/pushes the optimized assets to `main`. Cloudflare Pages redeploys automatically.
6. `ASSET-REPORT.md` is generated with per-file sizes and totals.

### One-time authorization required

**GitHub Actions cannot inherit the private credentials of the ChatGPT Figma connector.** To let GitHub access this Figma file without manual asset exports, configure a Figma personal access token once:

1. Generate a read-only token in Figma account settings (access to the Cases file).
2. Open [GitHub Actions repository secrets](https://github.com/romakhokhlov/finam-case/settings/secrets/actions) → New repository secret.
3. Name: `FIGMA_TOKEN`; value: your Figma token.
4. Open [Sync Finam images from Figma](https://github.com/romakhokhlov/finam-case/actions/workflows/sync-figma-images.yml) → Run workflow.

Never share the token in chat or commit it to files.

Subsequent changes to `figma-assets.json` or the exporter will automatically trigger the workflow. You can also re-run it for changed images at the same Figma node IDs. Brand-new image layers require adding their IDs to `figma-assets.json`.

### Current limitations

- Until `FIGMA_TOKEN` is set and the workflow succeeds, **the existing site images have not been re-exported or replaced.**
- Exporting a standalone image layer avoids capturing neighbouring Figma layers. It does not magically remove pixels already baked into that image's raster fill. Such source-image backgrounds must be fixed at the Figma source.
- The existing `frame-gradient.svg` stays in the repository as a separate vector asset.
- Cloudflare Pages must already be connected to branch `main`.
- PNG generated during processing lives only in GitHub runner memory; the action writes optimized WebP files into Git.

## Site

[Finam preview](https://finam-case.pages.dev/)
