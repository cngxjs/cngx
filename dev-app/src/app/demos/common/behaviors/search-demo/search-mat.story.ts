import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Search — mat-form-field',
  apiComponents: ['CngxSearch'],
  moduleImports: [
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly searchTerm = signal('');

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
  `,
  sections: [
    {
      title: 'CngxSearch inside mat-form-field',
      subtitle: 'Add both <code>matInput</code> and <code>cngxSearch</code> to the same <code>&lt;input&gt;</code>. Material handles the field chrome; <code>cngxSearch</code> handles debounce + <code>(searchChange)</code>. No conflicts.',
      imports: ['CngxSearch', 'MatFormFieldModule', 'MatInputModule', 'MatIconModule'],
      template: `
  <mat-form-field appearance="outline" style="width:100%">
    <mat-label>Search people</mat-label>
    <mat-icon matPrefix>search</mat-icon>
    <input
      matInput
      cngxSearch
      [debounceMs]="200"
      (searchChange)="searchTerm.set($event)"
      placeholder="Name, role or location…"
    />
    @if (searchTerm()) {
      <mat-icon matSuffix style="cursor:pointer" (click)="searchTerm.set('')">close</mat-icon>
    }
  </mat-form-field>
  <div class="table-wrap">
    <table class="demo-table">
      <thead>
        <tr><th>Name</th><th>Role</th><th>Location</th></tr>
      </thead>
      <tbody>
        @for (row of searchRows(); track row.name) {
          <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
        } @empty {
          <tr><td colspan="3" class="empty-cell">No results for "{{ searchTerm() }}".</td></tr>
        }
      </tbody>
    </table>
  </div>
  <div class="output-badge">
    searchChange: <strong>{{ searchTerm() || '—' }}</strong> &mdash; {{ searchRows().length }} results
  </div>`,
    },
    {
      title: 'mat-form-field — Filled variant',
      subtitle: 'Works with all Material form-field appearances: <code>outline</code>, <code>fill</code>.',
      template: `
  <mat-form-field appearance="fill" style="width:100%">
    <mat-label>Search people</mat-label>
    <mat-icon matPrefix>search</mat-icon>
    <input
      matInput
      cngxSearch
      [debounceMs]="200"
      (searchChange)="searchTerm.set($event)"
      placeholder="Name, role or location…"
    />
    @if (searchTerm()) {
      <mat-icon matSuffix style="cursor:pointer" (click)="searchTerm.set('')">close</mat-icon>
    }
    <mat-hint>{{ searchRows().length }} / {{ searchRows().length + (searchTerm() ? 0 : 0) }} results</mat-hint>
  </mat-form-field>
  <div class="table-wrap" style="margin-top:0.5rem">
    <table class="demo-table">
      <thead>
        <tr><th>Name</th><th>Role</th><th>Location</th></tr>
      </thead>
      <tbody>
        @for (row of searchRows(); track row.name) {
          <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
        } @empty {
          <tr><td colspan="3" class="empty-cell">No results.</td></tr>
        }
      </tbody>
    </table>
  </div>`,
    },
  ],
};
