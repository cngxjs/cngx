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

interface DotModel {
  readonly dots: readonly Dot[];
  /** Index of the leftmost dot shown in the viewport; drives the track translate. */
  readonly firstVisible: number;
  /** `true` once the page count exceeds the visible window (track glides). */
  readonly windowed: boolean;
}

/** Visible dot count in the viewport before the track scrolls. */
const VISIBLE = 7;
/** Pages flanking the centred current page inside the viewport. */
const HALF = Math.floor(VISIBLE / 2);

/**
 * Build the full dot sequence plus the viewport anchor. Every page gets a dot;
 * for large counts the dots that fall outside the centred `VISIBLE` window are
 * shrunk to `small` (they sit off-screen behind the viewport clip and shrink as
 * they glide out), and the two dots at each truncated visible edge step down
 * medium -> small (iOS page-control edge-shrink). The consumer translates the
 * track by `firstVisible` so navigation slides the strip instead of reshuffling
 * the DOM - the active dot stays centred and the row glides under it.
 */
function buildDots(current: number, total: number): DotModel {
  const count = Math.max(0, total);
  if (count === 0) {
    return { dots: [], firstVisible: 0, windowed: false };
  }
  const windowed = count > VISIBLE;
  const clamped = Math.min(Math.max(current, 0), count - 1);
  const firstVisible = windowed ? Math.min(Math.max(clamped - HALF, 0), count - VISIBLE) : 0;
  const lastVisible = windowed ? firstVisible + VISIBLE - 1 : count - 1;
  const moreBefore = firstVisible > 0;
  const moreAfter = lastVisible < count - 1;

  const dots: Dot[] = [];
  for (let i = 0; i < count; i++) {
    let size: DotSize = 'full';
    if (windowed) {
      if (i < firstVisible || i > lastVisible) {
        size = 'small';
      } else if (moreBefore && i === firstVisible) {
        size = 'small';
      } else if (moreBefore && i === firstVisible + 1) {
        size = 'medium';
      } else if (moreAfter && i === lastVisible) {
        size = 'small';
      } else if (moreAfter && i === lastVisible - 1) {
        size = 'medium';
      }
    }
    dots.push({ index: i, size });
  }
  return { dots, firstVisible, windowed };
}

function dotsEqual(a: DotModel, b: DotModel): boolean {
  if (a === b) {
    return true;
  }
  if (a.firstVisible !== b.firstVisible || a.windowed !== b.windowed) {
    return false;
  }
  if (a.dots.length !== b.dots.length) {
    return false;
  }
  return a.dots.every((d, i) => d.index === b.dots[i].index && d.size === b.dots[i].size);
}

/**
 * The dots indicator: one circular `<button>` per page inside a clipped viewport
 * track. The active dot carries `aria-current="page"`; every dot exposes its page
 * name via `aria-label` (the circle is decorative). Click navigates through the
 * brain, gated while busy. For large counts the track glides (CSS transform
 * transition) to keep the active dot centred, iOS page-control style, instead of
 * reshuffling the DOM. Dot DOM + windowing live here, not in a shared atom.
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
    <div class="cngx-paginator__dots" [class.cngx-paginator__dots--windowed]="model().windowed">
      <div class="cngx-paginator__dots-track" [style.--cngx-paginator-dots-shift]="model().firstVisible">
        @for (dot of model().dots; track dot.index) {
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
    </div>
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorDots {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  protected readonly config = injectPaginatorConfig();

  /**
   * The rendered dots + viewport anchor. Structural `equal` keeps the reference
   * stable across recomputes that yield an identical model, so the `@for` does
   * not churn (signal-equality rule).
   */
  protected readonly model = computed<DotModel>(
    () => buildDots(this.host.pageIndex(), this.host.totalPages()),
    { equal: dotsEqual },
  );

  protected isCurrent(index: number): boolean {
    return index === this.host.pageIndex();
  }

  protected goto(index: number): void {
    this.host.setPage(index);
  }
}
