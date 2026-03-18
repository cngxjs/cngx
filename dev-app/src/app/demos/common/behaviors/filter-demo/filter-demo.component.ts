import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CngxFilter } from '@cngx/common';
import { ExampleCardComponent } from '../../../../shared/example-card.component';

interface Person {
  name: string;
  role: string;
  location: string;
}

const PEOPLE: Person[] = [
  { name: 'Alice Schmidt', role: 'Engineer', location: 'Berlin' },
  { name: 'Bob Müller', role: 'Designer', location: 'London' },
  { name: 'Charlie Wang', role: 'Manager', location: 'Berlin' },
  { name: 'Diana Rossi', role: 'Engineer', location: 'Rome' },
  { name: 'Erik Larsson', role: 'DevOps', location: 'Stockholm' },
  { name: 'Fatima Ali', role: 'Engineer', location: 'Remote' },
  { name: 'Georg Bauer', role: 'Designer', location: 'Berlin' },
  { name: 'Helen Kim', role: 'Manager', location: 'Seoul' },
];

const LOCATIONS = [...new Set(PEOPLE.map((p) => p.location))].sort((a, b) => a.localeCompare(b));
const ROLES = [...new Set(PEOPLE.map((p) => p.role))].sort((a, b) => a.localeCompare(b));

@Component({
  selector: 'app-filter-demo',
  standalone: true,
  imports: [CngxFilter, ExampleCardComponent],
  templateUrl: './filter-demo.component.html',
  styleUrl: './filter-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDemoComponent {
  protected readonly totalPeople = PEOPLE.length;
  protected readonly locations = LOCATIONS;
  protected readonly roles = ROLES;

  // ── Controlled mode ──────────────────────────────────────────────────────
  protected readonly activeLocation = signal<string | null>(null);

  protected readonly filterPredicate = computed(
    (): ((p: Person) => boolean) | null => {
      const loc = this.activeLocation();
      return loc ? (p) => p.location === loc : null;
    },
  );

  protected readonly filteredRows = computed((): Person[] => {
    const pred = this.filterPredicate();
    if (!pred) return PEOPLE;
    return PEOPLE.filter((p) => pred(p));
  });

  // ── Uncontrolled mode ────────────────────────────────────────────────────
  protected readonly activeRole = signal<string | null>(null);
  private readonly uncontrolledPredicate = signal<((p: unknown) => boolean) | null>(null);

  protected readonly uncontrolledRows = computed((): Person[] => {
    const pred = this.uncontrolledPredicate();
    if (!pred) return PEOPLE;
    return PEOPLE.filter((p) => pred(p));
  });

  // Returns (p: unknown) so it's compatible with CngxFilter<unknown> from the template ref
  protected rolePred(role: string): (p: unknown) => boolean {
    return (p) => (p as Person).role === role;
  }

  protected onFilterChange(pred: ((p: unknown) => boolean) | null): void {
    this.uncontrolledPredicate.set(pred);
  }
}
