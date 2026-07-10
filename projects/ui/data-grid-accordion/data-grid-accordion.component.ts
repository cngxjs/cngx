import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { coerceNumberProperty } from '@cngx/core/utils';
import { CngxAccordion } from '@cngx/common/interactive';
import { CngxSort } from '@cngx/common/data';

import {
  CNGX_DATA_GRID_ACCORDION,
  type CngxDataGridAccordionContext,
} from './data-grid-accordion.token';
import type { CngxDataGridSkin } from './config/data-grid-accordion.config';
import { injectDataGridAccordionConfig } from './config/inject-data-grid-accordion-config';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDataGridRow } from './data-grid-row.component';
import type { CngxDgCellTrack } from './data-grid-cell.directive';

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
 * no selection model, no keyboard grid navigation. It hosts the orthogonal
 * {@link CngxSort} atom as a second `hostDirective` and exposes it on
 * {@link CNGX_DATA_GRID_ACCORDION} as `sort`, so header cells become sortable with
 * one `cngxDgaSortHeader` attribute (no `[cngxSortRef]` plumbing) and a consumer can
 * bind the controlled `[sortActive]` / `[sortDirection]` inputs and read `(sortChange)`.
 * The group only publishes the sort state - the consumer still derives the ordered
 * rows via a `computed()` and owns the `@for`; the open set is keyed by row value so a
 * sorted row stays open while it moves.
 *
 * The column widths are declared on the header cells via `col`
 * (`grow` / `fit` / `sm` / `md` / `lg`); the group derives the shared template from
 * them, so no `grid-template-columns` string is needed for the common case.
 *
 * ```html
 * <cngx-data-grid-accordion [multi]="true">
 *   <cngx-dga-header>
 *     <span cngxDgaCell col="sm">ID</span>
 *     <span cngxDgaCell col="grow">Name</span>
 *     <span cngxDgaCell col="md" align="end">Amount</span>
 *   </cngx-dga-header>
 *   <cngx-dga-row panelId="1">
 *     <span cngxDgaCell>1</span>
 *     <span cngxDgaCell primary>Alpha</span>
 *     <span cngxDgaCell align="end">120.00</span>
 *     Detail for row 1
 *   </cngx-dga-row>
 *   <cngx-dga-footer>
 *     <span cngxDgaCell>Total</span>
 *   </cngx-dga-footer>
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
  // Skin CSS lives after the base so the unlayered `[data-skin]` @scope rules win
  // the ties by source order (mirrors the accordion / tabs skin split).
  styleUrls: ['./data-grid-accordion.component.css', './data-grid-accordion-skins.css'],
  hostDirectives: [
    { directive: CngxAccordion, inputs: ['multi', 'openIds'], outputs: ['openIdsChange'] },
    // Sort is the orthogonal `@cngx/common/data` atom, hosted here so header cells reach
    // it through the context token with no `[cngxSortRef]`. Its controlled inputs are
    // re-exposed as `[sortActive]` / `[sortDirection]`; the primary change re-emits as
    // `(sortChange)`. The group publishes state only - derivation stays with the consumer.
    {
      directive: CngxSort,
      inputs: ['cngxSortActive: sortActive', 'cngxSortDirection: sortDirection', 'multiSort'],
      outputs: ['sortChange'],
    },
  ],
  providers: [{ provide: CNGX_DATA_GRID_ACCORDION, useExisting: CngxDataGridAccordion }],
  // The inner `__grid` is the single grid that owns the tracks; the host stays the
  // horizontal scroll container. Header, rows, and footer are `subgrid` items of it
  // (see the CSS), so content-sized (`fit`) columns resolve once and align across
  // all three instead of each grid sizing them independently.
  template: '<div class="cngx-data-grid-accordion__grid"><ng-content /></div>',
  host: {
    class: 'cngx-data-grid-accordion',
    '[attr.data-skin]': 'resolvedSkin() ?? null',
    '[style.--cngx-dga-columns]': 'resolvedColumns()',
  },
})
export class CngxDataGridAccordion implements CngxDataGridAccordionContext {
  // Config cascade source. Declared first so the resolvedSkin computed below can
  // read it (field initialisers run top-to-bottom).
  private readonly config = injectDataGridAccordionConfig();

  /**
   * The hosted {@link CngxSort} instance, exposed on {@link CNGX_DATA_GRID_ACCORDION}
   * so `cngxDgaSortHeader` cells read the shared sort with no `[cngxSortRef]`. It is a
   * `hostDirective`, so it lives on this element's injector; `{ self: true }` resolves
   * that instance rather than an ancestor's. The group publishes it as state - the
   * consumer's `computed()` still derives the ordered rows (Ableitung preserved).
   */
  readonly sort = inject(CngxSort, { self: true });

  /**
   * Raw `grid-template-columns` escape hatch. Leave it unset for the common case:
   * the group derives the shared template from the header cells' `col` intents
   * (see {@link resolvedColumns}). Set it only when a skin needs track syntax the
   * `col` vocabulary cannot express - `ch` tracks, `subgrid`, `minmax` - such as the
   * `spreadsheet` skin. When set, it wins over the derived value. It holds content
   * columns only: the disclosure chevron rides a leading gutter outside the grid, so
   * it never consumes a track. Per-instance only - no app-wide config default
   * (unlike `[skin]`).
   */
  readonly columns = input<string | undefined>(undefined);

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

  // The header is the single column source; the first row provides the primary
  // index (for the grow default) and doubles as the source when no header exists.
  private readonly header = contentChild(CngxDataGridHeader);
  private readonly firstRow = contentChild(CngxDataGridRow);

  /** Index of the primary column, read from the first row's `primary` cell (-1 = none). */
  private readonly primaryIndex = computed(
    () => this.firstRow()?.cells().findIndex((cell) => cell.primary()) ?? -1,
  );

  /** Column source: the header cells, or the first row's cells when no header exists. */
  private readonly sourceCells = computed(
    () => this.header()?.cells() ?? this.firstRow()?.cells() ?? [],
  );

  /**
   * `grid-template-columns` derived from the column intents: each source cell's
   * `col` track maps to a CSS track; unset falls back to the default (the primary
   * column grows, every other column fits). `null` until a source cell exists.
   */
  private readonly derivedColumns = computed<string | null>(() => {
    const cells = this.sourceCells();
    if (cells.length === 0) {
      return null;
    }
    const primary = this.primaryIndex();
    return cells.map((cell, index) => trackFor(cell.col(), index === primary)).join(' ');
  });

  /**
   * The shared column template published onto `--cngx-dga-columns`. Derivation over
   * management (Pillar 1): a single `computed()` from one source (the header), not a
   * hand-synced string. Precedence: an explicit `[columns]` escape hatch wins, else
   * the header-derived template, else a single `1fr`. Primitive string, so
   * `Object.is` dedupes with no `equal` fn.
   */
  protected readonly resolvedColumns = computed(
    () => this.columns() ?? this.derivedColumns() ?? '1fr',
  );
}

/**
 * Map a cell's `col` track intent to one CSS `grid-template-columns` track. Unset
 * (`undefined`) falls back to the derived default: the primary column grows
 * (`minmax(0, 1fr)`), every other column fits its content (`auto`). The named sizes
 * resolve against the registered `--cngx-dga-col-sm|-md|-lg` tokens, each with a rem
 * fallback so the track stays valid even before the token surface loads (an invalid
 * `var()` would collapse the whole `grid-template-columns` to one column).
 */
function trackFor(track: CngxDgCellTrack | undefined, isPrimary: boolean): string {
  switch (track) {
    case 'grow':
      return 'minmax(0, 1fr)';
    case 'fit':
      return 'auto';
    case 'sm':
      return 'var(--cngx-dga-col-sm, 5rem)';
    case 'md':
      return 'var(--cngx-dga-col-md, 7rem)';
    case 'lg':
      return 'var(--cngx-dga-col-lg, 10rem)';
    default:
      return isPrimary ? 'minmax(0, 1fr)' : 'auto';
  }
}

/**
 * Coerce a bound value to a number (via `coerceNumberProperty`, falling back to
 * `fallback`) and clamp it into the ARIA heading-level range 2-6.
 */
function clampHeadingLevel(value: number | string, fallback = 3): number {
  return Math.min(6, Math.max(2, coerceNumberProperty(value, fallback)));
}
