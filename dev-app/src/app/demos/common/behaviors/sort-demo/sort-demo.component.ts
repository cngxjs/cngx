import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CngxSort, CngxSortHeader } from '@cngx/common';
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

@Component({
  selector: 'app-sort-demo',
  standalone: true,
  imports: [CngxSort, CngxSortHeader, ExampleCardComponent],
  templateUrl: './sort-demo.component.html',
  styleUrl: './sort-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortDemoComponent {
  protected readonly sortState = signal<{ active: string; direction: 'asc' | 'desc' } | null>(null);

  protected readonly sortedRows = computed((): Person[] => {
    const s = this.sortState();
    if (!s) return PEOPLE;
    return [...PEOPLE].sort((a, b) => {
      const av = (a as unknown as Record<string, string>)[s.active] ?? '';
      const bv = (b as unknown as Record<string, string>)[s.active] ?? '';
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
      return s.direction === 'asc' ? cmp : -cmp;
    });
  });
}
