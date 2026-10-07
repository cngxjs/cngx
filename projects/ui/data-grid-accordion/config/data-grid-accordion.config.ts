import type { Signal } from '@angular/core';

/**
 * Selectable visual skin for `<cngx-data-grid-accordion>`. \
 * The skin is a pure thematic concern - every value renders the identical
 * header / row / region structure, cells, ARIA, and keyboard behaviour, and only
 * redirects CSS via the `[data-skin]` host attribute. Typed class-sugar (mirrors
 * {@link CngxAccordionSkin}), not a behaviour-branching mode flag.
 *
 * `'ledger'` zebra rows + sum footer; `'spreadsheet'` cell hairlines + row-number
 * gutter; `'log-stream'` mono grid with a severity edge; `'master-detail'`
 * primary-tinted open row + sub-table detail; `'report'` frameless double rules;
 * `'density'` compact/standard/spacious token hooks.
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export type CngxDataGridSkin =
  | 'ledger'
  | 'spreadsheet'
  | 'log-stream'
  | 'master-detail'
  | 'report'
  | 'density';

/**
 * Per-row semantic severity, reflected onto the `[data-severity]` host attribute
 * for skins that visualise it (the `log-stream` skin maps it to a coloured left
 * edge via the `--cngx-color-danger` / `-warning` / `-info` tokens). Structural
 * only - it changes no ARIA and no behaviour, and unset rows simply carry no
 * severity.
 *
 * Re-declared locally as an identical union rather than imported from the
 * accordion entry, so this entry pulls in nothing from a sibling `@cngx/ui`
 * entry. The duplication is a tracked decision, re-evaluated if a shared severity
 * union lands in `@cngx/core`.
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export type CngxDataGridSeverity = 'error' | 'warning' | 'info';

/**
 * App-wide cascade for the data-grid-accordion's default visual skin.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance `[skin]` Input binding.
 *   2. `provideDataGridAccordionConfigAt(...)` in a parent component's
 *      `viewProviders` (component-scoped override).
 *   3. `provideDataGridAccordionConfig(...)` at the application root.
 *   4. Library default (unset - the base flat grid look).
 *
 * The column template (`[columns]`) is deliberately absent: every grid carries a
 * different column set, so it stays a per-instance input with a base fallback and
 * has no app-wide default. Skin is the only surface with a plausible app-wide
 * default, mirroring {@link withAccordionSkin}.
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export interface CngxDataGridAccordionConfig {
  /**
   * App-wide default visual skin reflected onto `[data-skin]`. Unset by default
   * (the base flat grid look). A per-instance `[skin]` Input still wins; this
   * only moves the cascade default. Override via {@link withDataGridSkin}.
   */
  readonly skin?: CngxDataGridSkin;
  /**
   * App-wide copy for the grid's count, sort, filter and row surfaces. Reactive
   * from birth: pass a partial bundle or a `Signal` of one; unset keys keep the
   * English default. Override via {@link withDataGridAccordionLabels}.
   */
  readonly labels?:
    | Partial<CngxDataGridAccordionLabels>
    | Signal<Partial<CngxDataGridAccordionLabels>>;
}

/**
 * User-facing copy of the data-grid-accordion family. Library defaults are
 * English. Keys read as input defaults (`countSingular`, `sort*`, `filter*`,
 * `rowLoadFailed`) are read once when each part is created; `count` and `note`
 * follow a live bundle.
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export interface CngxDataGridAccordionLabels {
  /** Text of the `CngxDgaCount` live region for a visible-row count. */
  readonly count: (count: number) => string;
  /** Default of `[cngxDgaCountSingular]`. */
  readonly countSingular: string;
  /** Default of `[cngxDgaCountPlural]`. */
  readonly countPlural: string;
  /** Text of the `CngxDgaCount` live region when a noun is bound: the count and the noun. */
  readonly countWithNoun: (count: number, noun: string) => string;
  /** Default of `[cngxDgaSortStatusNotSorted]`, the described sort status while unsorted. */
  readonly sortNone: string;
  /** Default of `[cngxDgaSortStatusAscending]`. */
  readonly sortAscending: string;
  /** Default of `[cngxDgaSortStatusDescending]`. */
  readonly sortDescending: string;
  /** Default of `[cngxDgaSortAnnounceAscending]`; `{label}` is replaced by the column name. */
  readonly sortAnnouncedAscending: string;
  /** Default of `[cngxDgaSortAnnounceDescending]`; `{label}` is replaced by the column name. */
  readonly sortAnnouncedDescending: string;
  /** Default of `[cngxDgaSortAnnounceCleared]`; `{label}` is replaced by the column name. */
  readonly sortAnnouncedCleared: string;
  /** Column name of a sort announcement when the header has no `[cngxDgaSortLabel]` and no text. */
  readonly unlabeledColumn: string;
  /** Default of the `CngxDgaFilterField` visible `[label]`. */
  readonly filter: string;
  /** Default of `[cngxDgaFilterLabel]`, the filter box accessible name. */
  readonly filterRows: string;
  /** Default of the `CngxDataGridRow` `[errorMessage]`. */
  readonly rowLoadFailed: string;
  /**
   * Tag the skins draw before a row's detail region (CSS `content`), read from the
   * region's `data-note-label`. Decorative: it never enters the accessible name.
   */
  readonly note: string;
}
