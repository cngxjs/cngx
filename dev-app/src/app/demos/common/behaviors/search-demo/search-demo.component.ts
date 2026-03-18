import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CngxSearch } from '@cngx/common';
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
  selector: 'app-search-demo',
  standalone: true,
  imports: [CngxSearch, ExampleCardComponent],
  templateUrl: './search-demo.component.html',
  styleUrl: './search-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDemoComponent {
  protected readonly searchTerm = signal('');
  protected readonly debounceMs = signal(300);

  protected readonly searchRows = computed((): Person[] => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return PEOPLE;
    return PEOPLE.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.role.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term),
    );
  });
}
