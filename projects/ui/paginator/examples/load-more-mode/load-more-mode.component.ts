import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';

import { CngxPaginator, CngxPaginatorLoadMore } from '@cngx/ui/paginator';

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
 * Load-more (append) paging over the same brain. `cngx-pgn-load-more` steps
 * `pageIndex` forward; the host slices from the top through the current page,
 * so each click reveals the next batch instead of replacing the page. On the
 * last page the button disables and switches to the all-loaded label.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxPaginator, CngxPaginatorLoadMore],
  styleUrl: './load-more-mode.component.scss',
  template: `
    <div class="demo-card">
      <ul class="demo-list-flush">
        @for (p of shownItems(); track p.name) {
          <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
        }
      </ul>
      <cngx-paginator
        aria-label="People"
        [total]="people().length"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
        [pageSize]="pageSize()"
        (pageSizeChange)="pageSize.set($event)"
      >
        <cngx-pgn-load-more />
      </cngx-paginator>
    </div>
  `,
})
export class LoadMoreModeExample {
  protected readonly people = signal<Person[]>([
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' III' })),
  ]);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(5);

  // Append-style: slice from the top through the current page.
  protected readonly shownItems = computed<Person[]>(() =>
    this.people().slice(0, (this.pageIndex() + 1) * this.pageSize()),
  );
}
