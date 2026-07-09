import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { coerceNumberProperty } from '@cngx/core/utils';
import { CngxAccordion } from '@cngx/common/interactive';

import {
  CNGX_DATA_GRID_ACCORDION,
  type CngxDataGridAccordionContext,
} from './data-grid-accordion.token';
import type { CngxDataGridSkin } from './config/data-grid-accordion.config';
import { injectDataGridAccordionConfig } from './config/inject-data-grid-accordion-config';

/**
 * Data-grid accordion group. A disclosure accordion whose header, rows, and
 * footer all share one `grid-template-columns` contract, so N arbitrary cells
 * align down the grid - the ceiling the accordion `data-grid` skin could never
 * reach with its fixed three slots. Hosts the headless {@link CngxAccordion}
 * brain via `hostDirectives` (so `CNGX_ACCORDION` and roving keyboard nav come
 * with it), forwards `[multi]` and the controlled `[(openIds)]` model, publishes
 * the column template onto the inherited `--cngx-dga-columns` property, and
 * reflects `[skin]` onto `[data-skin]`. Projects its {@link CngxDataGridHeader},
 * {@link CngxDataGridRow}s, and {@link CngxDataGridFooter} through a single
 * `<ng-content />`; it owns no rendering beyond providing
 * {@link CNGX_DATA_GRID_ACCORDION} so rows read the shared heading level.
 *
 * It is a disclosure accordion, not a data grid: no `role="grid"`, no cell edit,
 * no selection model, no keyboard grid navigation. Sort and filter compose from
 * the orthogonal `CngxSort` / `CngxFilter` atoms in the header slot; the open set
 * is keyed by row value so a sorted row stays open while it moves.
 *
 * ```html
 * <cngx-data-grid-accordion columns="8ch 1fr auto auto" [multi]="true">
 *   <cngx-data-grid-header>
 *     <span cngxDgCell>ID</span>
 *     <span cngxDgCell>Name</span>
 *     <span cngxDgCell align="end">Amount</span>
 *   </cngx-data-grid-header>
 *   <cngx-data-grid-row panelId="1">
 *     <span cngxDgCell>1</span>
 *     <span cngxDgCell primary>Alpha</span>
 *     <span cngxDgCell align="end">120.00</span>
 *     Detail for row 1
 *   </cngx-data-grid-row>
 *   <cngx-data-grid-footer>
 *     <span cngxDgCell>Total</span>
 *   </cngx-data-grid-footer>
 * </cngx-data-grid-accordion>
 * ```
 *
 * @category ui/data-grid-accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-accordion.component.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridRow, CngxDgCell, CngxDataGridHeader, CngxDataGridFooter, CngxAccordion
 */
@Component({
  selector: 'cngx-data-grid-accordion',
  exportAs: 'cngxDataGridAccordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './data-grid-accordion.component.css',
  hostDirectives: [
    { directive: CngxAccordion, inputs: ['multi', 'openIds'], outputs: ['openIdsChange'] },
  ],
  providers: [{ provide: CNGX_DATA_GRID_ACCORDION, useExisting: CngxDataGridAccordion }],
  template: '<ng-content />',
  host: {
    class: 'cngx-data-grid-accordion',
    '[attr.data-skin]': 'resolvedSkin() ?? null',
    '[style.--cngx-dga-columns]': 'columns()',
  },
})
export class CngxDataGridAccordion implements CngxDataGridAccordionContext {
  // Config cascade source. Declared first so the resolvedSkin computed below can
  // read it (field initialisers run top-to-bottom).
  private readonly config = injectDataGridAccordionConfig();

  /**
   * The shared `grid-template-columns` value published onto the inherited
   * `--cngx-dga-columns` property. Header, every row's summary, and footer read
   * it, so all three rows align on one contract with zero JS measurement. Ends
   * with an `auto` track for the row chevron (the header/footer leave that track
   * empty). Per-instance only - each grid has a different column set, so there
   * is no app-wide config default (unlike `[skin]`).
   */
  readonly columns = input<string>('1fr');

  /**
   * Heading level (2-6) every row's `role="heading"` wrapper reflects via
   * `aria-level`. Clamped into the valid ARIA range so a stray `0`/`9` can never
   * emit an invalid `aria-level`; the default is clamped explicitly because
   * Angular runs `transform` only on bound values, not the initial default.
   * Coerced from string via `coerceNumberProperty` for attribute binding.
   */
  readonly headingLevel = input(clampHeadingLevel(3), {
    transform: (value: number | string) => clampHeadingLevel(value),
  });

  /**
   * Visual skin reflected onto the `[data-skin]` host attribute. Resolves
   * `input ?? CNGX_DATA_GRID_ACCORDION_CONFIG.skin`: an unbound `[skin]` falls
   * back to the app-wide config default (`withDataGridSkin`); unset on both
   * leaves the base flat grid look. The skin only redirects CSS - structure,
   * cells, ARIA, and keyboard behaviour are identical across skins.
   */
  readonly skin = input<CngxDataGridSkin | undefined>(undefined);

  /** `[skin]` input over the config default. `null` host binding when unset. */
  protected readonly resolvedSkin = computed<CngxDataGridSkin | undefined>(
    () => this.skin() ?? this.config.skin,
  );
}

/**
 * Coerce a bound value to a number (via `coerceNumberProperty`, falling back to
 * `fallback`) and clamp it into the ARIA heading-level range 2-6.
 */
function clampHeadingLevel(value: number | string, fallback = 3): number {
  return Math.min(6, Math.max(2, coerceNumberProperty(value, fallback)));
}
