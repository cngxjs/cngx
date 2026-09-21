import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';

import { CngxBucketPaginate, type CngxBucket } from '@cngx/common/data';
import { CngxPaginatorAlpha } from '@cngx/ui/paginator';

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
 * Alphabetical bucket paging. `cngxBucketPaginate` partitions the list into
 * letter-range buckets (A-C, D-F ...) and `cngx-pgn-alpha` renders the chip
 * strip - a sibling model to the page-index brain, not a flag on it. Selecting
 * a chip filters the list; re-selecting it clears the filter. Empty buckets are
 * disabled with a stated reason, never silently dead.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxBucketPaginate, CngxPaginatorAlpha],
  styleUrl: './alpha-mode.component.scss',
  template: `
    <div
      class="demo-card demo-pgn-alpha-stack"
      cngxBucketPaginate
      [buckets]="buckets"
      [items]="people()"
      [active]="active()"
      (activeChange)="active.set($event)"
    >
      <cngx-pgn-alpha />
      <ul class="demo-list-flush">
        @for (p of visible(); track p.name) {
          <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
        }
      </ul>
    </div>
  `,
})
export class AlphaModeExample {
  protected readonly people = signal<readonly Person[]>(PEOPLE);

  protected readonly buckets: readonly CngxBucket<Person>[] = [
    { label: 'A-C', match: (p: Person) => this.inRange(p, 'A', 'C') },
    { label: 'D-F', match: (p: Person) => this.inRange(p, 'D', 'F') },
    { label: 'G-I', match: (p: Person) => this.inRange(p, 'G', 'I') },
    { label: 'J-L', match: (p: Person) => this.inRange(p, 'J', 'L') },
    { label: 'M-O', match: (p: Person) => this.inRange(p, 'M', 'O') },
    { label: 'P-R', match: (p: Person) => this.inRange(p, 'P', 'R') },
    { label: 'S-U', match: (p: Person) => this.inRange(p, 'S', 'U') },
    { label: 'V-Z', match: (p: Person) => this.inRange(p, 'V', 'Z') },
  ];

  protected readonly active = signal<string | null>(null);

  protected readonly visible = computed<readonly Person[]>(() => {
    const label = this.active();
    if (label === null) {
      return this.people();
    }
    const bucket = this.buckets.find((b) => b.label === label);
    return bucket ? this.people().filter((p) => bucket.match(p)) : this.people();
  });

  private inRange(p: Person, lo: string, hi: string): boolean {
    const c = p.name[0]?.toUpperCase() ?? '';
    return c >= lo && c <= hi;
  }
}
