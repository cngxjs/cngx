import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CngxFilter, CngxSort, CngxSortHeader, cngxSmartDataSource } from '@cngx/common';
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

// ── SmartDataSource sub-component ──────────────────────────────────────────
// Carries CngxSort + CngxFilter as hostDirectives so cngxSmartDataSource()
// discovers them via DI when called in this component's injection context.

@Component({
  selector: 'cngx-smart-ds-example',
  standalone: true,
  imports: [CngxSortHeader, ExampleCardComponent],
  hostDirectives: [{ directive: CngxSort }, { directive: CngxFilter }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-example-card
      title="CngxSmartDataSource — Auto-Wired"
      subtitle="<code>cngxSmartDataSource()</code> is constructed inside this sub-component whose host element carries <code>[cngxSort]</code> and <code>[cngxFilter]</code> as <code>hostDirectives</code>. The DataSource auto-discovers them via <code>inject()</code> — no explicit wiring."
    >
      <div class="filter-row">
        <span class="filter-label">Filter location:</span>
        <button type="button" class="chip" (click)="filterBy(null)">All</button>
        @for (loc of locations; track loc) {
          <button type="button" class="chip" (click)="filterBy(loc)">{{ loc }}</button>
        }
      </div>
      <div class="table-wrap">
        <table class="demo-table">
          <thead>
            <tr>
              <th>
                <button cngxSortHeader="name" [cngxSortRef]="sort" #nH="cngxSortHeader" class="sort-btn">
                  Name @if (nH.isActive()) {<span class="sort-arrow">{{ nH.isAsc() ? '↑' : '↓' }}</span>}
                </button>
              </th>
              <th>
                <button cngxSortHeader="role" [cngxSortRef]="sort" #rH="cngxSortHeader" class="sort-btn">
                  Role @if (rH.isActive()) {<span class="sort-arrow">{{ rH.isAsc() ? '↑' : '↓' }}</span>}
                </button>
              </th>
              <th>
                <button cngxSortHeader="location" [cngxSortRef]="sort" #lH="cngxSortHeader" class="sort-btn">
                  Location @if (lH.isActive()) {<span class="sort-arrow">{{ lH.isAsc() ? '↑' : '↓' }}</span>}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.name) {
              <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
            } @empty {
              <tr><td colspan="3" class="empty-cell">No results.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <div class="status-row">
        <span class="status-badge" [class.active]="filter.isActive()">
          filter {{ filter.isActive() ? 'active' : 'off' }}
        </span>
        <span class="status-badge" [class.active]="sort.isActive()">
          sort {{ sort.isActive() ? sort.active() + ' ' + sort.direction() : 'off' }}
        </span>
        <span class="status-badge">{{ rows().length }} / {{ total }} rows</span>
      </div>
    </app-example-card>
  `,
  styles: `
    :host { display: contents; }

    .filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
    .filter-label { font-size: 0.85rem; color: #666; }
    .chip { padding: 0.25rem 0.625rem; border: 1px solid #ccc; border-radius: 999px; background: #fff; font-size: 0.8rem; cursor: pointer; }
    .chip:hover { background: #f0f0f0; }

    .table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden; margin-bottom: 1rem; background: #fff; }
    .demo-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .demo-table thead tr { background: #f9fafb; }
    .demo-table th, .demo-table td { text-align: left; padding: 0.6rem 0.875rem; border-bottom: 1px solid #eee; }
    .demo-table th { font-weight: 600; color: #555; }
    .demo-table tbody tr:last-child td { border-bottom: none; }
    .demo-table tbody tr:hover { background: #f5f5f5; }
    .empty-cell { text-align: center; color: #999; padding: 1.5rem !important; }

    .sort-btn { background: none; border: none; cursor: pointer; font-size: inherit; font-weight: inherit; color: inherit; padding: 0; display: inline-flex; align-items: center; gap: 0.2rem; }
    .sort-btn:hover { text-decoration: underline; }
    .sort-btn.cngx-sort-header--active { font-weight: 700; color: #4f46e5; }
    .sort-arrow { font-size: 0.75em; }

    .status-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .status-badge { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 0.25rem 0.5rem; font-size: 0.8rem; color: #6b7280; }
    .status-badge.active { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
  `,
})
class SmartDsExampleComponent {
  protected readonly sort = inject(CngxSort, { host: true });
  protected readonly filter = inject(CngxFilter<Person>, { host: true });
  protected readonly locations = LOCATIONS;
  protected readonly total = PEOPLE.length;

  private readonly items = signal(PEOPLE);
  private readonly ds = cngxSmartDataSource(this.items);
  protected readonly rows = toSignal(this.ds.connect(), { initialValue: [] as Person[] });

  protected filterBy(location: string | null): void {
    if (location === null) {
      this.filter.clear();
    } else {
      this.filter.setPredicate((p) => p.location === location);
    }
  }
}

// ── Page component ─────────────────────────────────────────────────────────

@Component({
  selector: 'app-smart-data-source-demo',
  standalone: true,
  imports: [SmartDsExampleComponent, ExampleCardComponent],
  templateUrl: './smart-data-source-demo.component.html',
  styleUrl: './smart-data-source-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartDataSourceDemoComponent {}
