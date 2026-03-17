import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { injectDataSource } from '@cngx/common';
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
  selector: 'app-data-source-demo',
  standalone: true,
  imports: [ExampleCardComponent],
  templateUrl: './data-source-demo.component.html',
  styleUrl: './data-source-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSourceDemoComponent {
  private readonly items = signal(PEOPLE);
  private readonly ds = injectDataSource(this.items);

  protected readonly rows = toSignal(this.ds.connect(), { initialValue: [] as Person[] });

  protected shuffle(): void {
    this.items.update((list) => [...list].sort(() => Math.random() - 0.5));
  }

  protected reset(): void {
    this.items.set(PEOPLE);
  }
}
