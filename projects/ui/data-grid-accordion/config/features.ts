import type { CngxDataGridSkin } from './data-grid-accordion.config';
import type { CngxDataGridAccordionConfigFeature } from './provide-data-grid-accordion-config';

// Sort and filter ship NO config feature (no `withDataGridSort` / `withDataGridFilter`).
// They are per-instance state - each grid sorts and filters its own data - so there is
// no plausible app-wide default to move onto the cascade, mirroring the deliberate
// absence of `withDataGridColumns`. `[skin]` earns `withDataGridSkin` because a design
// system does pick one skin org-wide; sort/filter never would. A `with*` is added only
// if a genuine app-wide default surfaces later (e.g. an org-wide multi-sort toggle),
// never speculatively.

/**
 * Set the app-wide default visual skin for `<cngx-data-grid-accordion>`. Unset by
 * default (the base flat grid look). Per-instance `[skin]` Input still wins; this
 * moves the cascade default. Structure, cells, ARIA, and keyboard behaviour are
 * identical across skins - only the `[data-skin]` host attribute changes the CSS.
 * Typed class-sugar, not a mode flag.
 *
 * ```ts
 * provideDataGridAccordionConfig(withDataGridSkin('ledger'));
 * ```
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export function withDataGridSkin(skin: CngxDataGridSkin): CngxDataGridAccordionConfigFeature {
  return { kind: 'skin', payload: { skin } };
}
