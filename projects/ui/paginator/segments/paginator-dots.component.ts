import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/** Resting size tier of a rendered dot. Edge dots shrink (iOS page-control). */
type DotSize = 'full' | 'medium' | 'small';

interface Dot {
  readonly index: number;
  readonly size: DotSize;
}

/** Visible dot count cap before the edge-shrink window kicks in. */
const MAX_DOTS = 7;

/**
 * Compute the windowed dot sequence around `current` for `total` pages. Small
 * counts render every dot full-size; large counts render a `MAX_DOTS` window
 * that slides to keep `current` centred, with the two dots nearest a truncated
 * edge rendered medium then small (iOS page-control edge-shrink). \
 * Pure, internal to this segment - dots stay organism-internal, no shared atom.
 */
function dotWindow(current: number, total: number): Dot[] {
  const count = Math.max(0, total);
  if (count === 0) {
    return [];
  }
  const visible = Math.min(count, MAX_DOTS);
  const half = Math.floor(visible / 2);
  const clamped = Math.min(Math.max(current, 0), count - 1);
  const start = Math.max(0, Math.min(clamped - half, count - visible));
  const end = start + visible - 1;
  const moreBefore = start > 0;
  const moreAfter = end < count - 1;

  const dots: Dot[] = [];
  for (let i = start; i <= end; i++) {
    let size: DotSize = 'full';
    if (moreBefore && i === start) {
      size = 'small';
    } else if (moreBefore && i === start + 1) {
      size = 'medium';
    } else if (moreAfter && i === end) {
      size = 'small';
    } else if (moreAfter && i === end - 1) {
      size = 'medium';
    }
    dots.push({ index: i, size });
  }
  return dots;
}

function dotsEqual(a: readonly Dot[], b: readonly Dot[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((d, i) => d.index === b[i].index && d.size === b[i].size);
}

/**
 * The dots indicator: one circular `<button>` per page, windowed with an
 * iOS-style edge-shrink for large counts. The active dot carries
 * `aria-current="page"`; every dot exposes its page name via `aria-label`
 * (the circle itself is decorative). Click navigates through the brain, gated
 * while busy. Dot DOM + windowing live here, not in a shared atom (over-
 * abstraction avoided - extract only when a second consumer appears).
 *
 * @category ui/paginator
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/segments/paginator-dots.component.ts
 * @since 0.1.0
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/dots/dots</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/dots</example-url>
 */
@Component({
  selector: 'cngx-pgn-dots',
  exportAs: 'cngxPgnDots',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cngx-paginator__dots">
      @for (dot of model(); track dot.index) {
        <button
          type="button"
          class="cngx-paginator__dot"
          [class.cngx-paginator__dot--current]="isCurrent(dot.index)"
          [attr.data-size]="dot.size"
          [attr.aria-current]="isCurrent(dot.index) ? 'page' : null"
          [attr.aria-label]="config.ariaLabels.page(dot.index + 1)"
          [attr.aria-disabled]="host.isBusy() ? 'true' : null"
          (click)="goto(dot.index)"
        ></button>
      }
    </div>
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorDots {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  protected readonly config = injectPaginatorConfig();

  /**
   * The rendered dot window. Structural `equal` keeps the reference stable
   * across recomputes that yield an identical window, so the `@for` does not
   * churn (signal-equality rule).
   */
  protected readonly model = computed<readonly Dot[]>(
    () => dotWindow(this.host.pageIndex(), this.host.totalPages()),
    { equal: dotsEqual },
  );

  protected isCurrent(index: number): boolean {
    return index === this.host.pageIndex();
  }

  protected goto(index: number): void {
    this.host.setPage(index);
  }
}
