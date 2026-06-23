import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';

import {
  CngxPaginator,
  CngxPaginatorDots,
  CngxPaginatorNext,
  CngxPaginatorPrev,
} from '@cngx/ui/paginator';

/**
 * The `dots` skin - paint-only, default (system-ui) themed.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxPaginator, CngxPaginatorPrev, CngxPaginatorDots, CngxPaginatorNext],
  styleUrl: './dots.component.scss',
  template: `
    <div class="skin-stage">
      <cngx-paginator
        skin="dots"
        [total]="50"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
      >
        <cngx-pgn-prev />
        <cngx-pgn-dots />
        <cngx-pgn-next />
      </cngx-paginator>
    </div>
  `,
})
export class DotsSkinExample {
  protected readonly pageIndex = signal(2);
}
