import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';

import { createManualState } from '@cngx/common/data';
import { CngxPaginator, CngxPaginatorInfinite } from '@cngx/ui/paginator';

interface Person {
  readonly name: string;
  readonly role: string;
  readonly location: string;
}

const PEOPLE: readonly Person[] = [
  { name: 'Ada Lovelace', role: 'Analyst', location: 'London' },
  { name: 'Brendan Eich', role: 'Architect', location: 'Mountain View' },
  { name: 'Carmen Diaz', role: 'Designer', location: 'Madrid' },
  { name: 'Dennis Ritchie', role: 'Engineer', location: 'Murray Hill' },
  { name: 'Edsger Dijkstra', role: 'Researcher', location: 'Eindhoven' },
  { name: 'Frances Allen', role: 'Compiler Lead', location: 'Peekskill' },
  { name: 'Grace Hopper', role: 'Admiral', location: 'Arlington' },
  { name: 'Hedy Lamarr', role: 'Inventor', location: 'Vienna' },
  { name: 'Ivan Sutherland', role: 'Pioneer', location: 'Portland' },
  { name: 'Joan Clarke', role: 'Cryptanalyst', location: 'Bletchley' },
  { name: 'Ken Thompson', role: 'Engineer', location: 'Berkeley' },
  { name: 'Linus Torvalds', role: 'Maintainer', location: 'Portland' },
  { name: 'Margaret Hamilton', role: 'Director', location: 'Cambridge' },
  { name: 'Radia Perlman', role: 'Engineer', location: 'Seattle' },
  { name: 'Tim Berners-Lee', role: 'Director', location: 'Geneva' },
  { name: 'Vint Cerf', role: 'Evangelist', location: 'Reston' },
];

/**
 * Infinite scroll paging over the same brain. `cngx-pgn-infinite` drops a
 * sentinel that auto-advances `pageIndex` as it enters the scroll container, so
 * the list grows as you scroll - while each batch keeps its addressable page
 * boundary (the sticky "Page n" divider). Binding `[state]` makes the busy-gate
 * pace the auto-load so the sentinel waits instead of racing through pages.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxPaginator, CngxPaginatorInfinite],
  styleUrl: './infinite-mode.component.scss',
  template: `
    <div class="demo-card">
      <div class="demo-pgn-infinite-frame">
        @for (group of revealed(); track group.page) {
          <div class="demo-page-divider">Page {{ group.page }}</div>
          <ul class="demo-list-flush">
            @for (p of group.items; track p.name) {
              <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
            }
          </ul>
        }
        <cngx-paginator
          aria-label="People"
          [total]="people().length"
          [state]="loadState"
          [pageIndex]="pageIndex()"
          (pageIndexChange)="pageIndex.set($event)"
          [pageSize]="pageSize()"
          (pageSizeChange)="pageSize.set($event)"
        >
          <cngx-pgn-infinite root=".demo-pgn-infinite-frame" rootMargin="0px 0px 48px 0px" />
        </cngx-paginator>
      </div>
    </div>
  `,
})
export class InfiniteModeExample {
  protected readonly people = signal<Person[]>(
    Array.from({ length: 6 }, (_, copy: number) =>
      PEOPLE.map((p: Person) => (copy === 0 ? p : { ...p, name: p.name + ' #' + (copy + 1) })),
    ).flat(),
  );
  protected readonly pageSize = signal(6);
  protected readonly pageIndex = signal(0);

  // Simulated fetch state: each advance flips busy for a beat, so the sentinel's
  // busy-gate paces the auto-load instead of racing through every page at once.
  protected readonly loadState = createManualState<void>();

  // Reveal a page only once its simulated fetch has settled - the row appearing
  // on settle is what re-arms the observer for the next scroll.
  protected readonly loadedPages = signal(1);

  protected readonly revealed = computed<{ page: number; items: Person[] }[]>(() => {
    const size = this.pageSize();
    const groups: { page: number; items: Person[] }[] = [];
    for (let page = 0; page < this.loadedPages(); page++) {
      const items = this.people().slice(page * size, (page + 1) * size);
      if (items.length) {
        groups.push({ page: page + 1, items });
      }
    }
    return groups;
  });

  constructor() {
    // Pace the auto-load: each advance flips busy for a beat so the sentinel
    // waits on the busy-gate instead of racing through every page at once.
    effect(() => {
      const wanted = this.pageIndex() + 1;
      untracked(() => {
        if (wanted <= this.loadedPages()) {
          return;
        }
        this.loadState.set('loading');
        setTimeout(() => {
          this.loadedPages.set(wanted);
          this.loadState.set('success');
        }, 500);
      });
    });
  }
}
