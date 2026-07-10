import { Directive, ElementRef, inject, input } from '@angular/core';

import { coerceBooleanProperty, nextUid } from '@cngx/core/utils';

/** Inline alignment of a data-grid cell within its column track. */
export type CngxDgCellAlign = 'start' | 'center' | 'end';

/**
 * Column-sizing intent for a data-grid track, authored on the `cngxDgCell`s of the
 * {@link CngxDataGridHeader} (the single column source). The group derives the
 * shared `grid-template-columns` from these:
 *
 * - `grow` - the flexible column, `minmax(0, 1fr)`; shares the remaining width.
 * - `fit` - content-sized, `auto`; as wide as its content needs.
 * - `sm` / `md` / `lg` - fixed tracks from the `--cngx-dga-col-sm|-md|-lg` tokens
 *   (mirrors the `size` vocabulary of `CngxTag` / `CngxIcon` / `CngxAvatar`).
 *
 * Unset falls back to the derived default: the `primary` column grows, every other
 * column fits.
 */
export type CngxDgCellTrack = 'grow' | 'fit' | 'sm' | 'md' | 'lg';

/**
 * A single cell in a {@link CngxDataGridRow}, {@link CngxDataGridHeader}, or
 * {@link CngxDataGridFooter}. Each cell occupies one track of the shared
 * `grid-template-columns` contract; `[align]` sets its inline alignment and
 * `[primary]` marks the one cell that names the row.
 *
 * The cell is visual: the row stays a single `cngxAccordionPanel` button and one
 * `role="region"`, so marking a cell `primary` only points the row's
 * `aria-labelledby` at it - it adds no interactive semantics. Exactly one cell
 * per row should carry `primary`, so the row's accessible name is that cell's
 * text alone rather than every cell concatenated.
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-cell.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridRow
 */
@Directive({
  selector: '[cngxDgCell]',
  exportAs: 'cngxDgCell',
  standalone: true,
  host: {
    class: 'cngx-dga-cell',
    '[id]': 'cellId',
    '[attr.data-align]': 'align()',
    '[attr.data-primary]': "primary() ? '' : null",
  },
})
export class CngxDgCell {
  /** Inline alignment within the column track: `start` (default), `center`, `end`. */
  readonly align = input<CngxDgCellAlign>('start');

  /**
   * Column-sizing intent read off the header cells to derive the shared grid
   * template ({@link CngxDgCellTrack}: `grow` / `fit` / `sm` / `md` / `lg`).
   * Authored on the {@link CngxDataGridHeader} cells; row and footer cells inherit
   * the derived track by position and can leave it unset. Unset falls back to the
   * default (primary column grows, the rest fit). Purely a sizing hint - no host
   * binding, the group reads the signal directly.
   */
  readonly col = input<CngxDgCellTrack | undefined>(undefined);
  /**
   * Marks this cell as the row's accessible name. The row's `cngxAccordionPanel`
   * button and its `role="region"` both point `aria-labelledby` at the primary
   * cell, so a screen reader announces one meaningful label per row instead of
   * the concatenated text of every cell.
   */
  readonly primary = input(false, { transform: coerceBooleanProperty });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * Stable id the row's `aria-labelledby` references. Reuses a consumer-supplied
   * `id` when present (so the IDREF stays what the consumer expects), otherwise
   * generates one. Read by {@link CngxDataGridRow} to resolve the primary cell.
   */
  readonly cellId = this.element.id || nextUid('cngx-dga-cell-');
}
