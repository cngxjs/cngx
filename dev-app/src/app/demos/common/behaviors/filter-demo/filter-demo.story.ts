import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter',
  moduleImports: [
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly totalPeople = PEOPLE.length;
  protected readonly locations = [...new Set(PEOPLE.map((p: Person) => p.location))].sort((a, b) => a.localeCompare(b));
  protected readonly roles = [...new Set(PEOPLE.map((p: Person) => p.role))].sort((a, b) => a.localeCompare(b));

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

  protected rolePred(role: string): (p: unknown) => boolean {
    return (p) => (p as Person).role === role;
  }

  protected onFilterChange(pred: ((p: unknown) => boolean) | null): void {
    this.uncontrolledPredicate.set(pred);
  }
  `,
  sections: [
    {
      title: 'CngxFilter — Controlled',
      subtitle: '<code>[cngxFilter]="pred()"</code> drives the directive from a <code>computed()</code>. When the signal changes, the directive updates automatically. <code>isActive()</code> reflects whether a predicate is set.',
      imports: ['CngxFilter'],
      template: `
  <div
    [cngxFilter]="filterPredicate()"
    #filterRef="cngxFilter"
    class="filter-container"
  >
    <div class="filter-row">
      <span class="filter-label">Filter by location:</span>
      <button
        type="button"
        class="chip"
        [class.chip--active]="activeLocation() === null"
        (click)="activeLocation.set(null)"
      >All</button>
      @for (loc of locations; track loc) {
        <button
          type="button"
          class="chip"
          [class.chip--active]="activeLocation() === loc"
          (click)="activeLocation.set(loc)"
        >{{ loc }}</button>
      }
    </div>
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Location</th></tr>
        </thead>
        <tbody>
          @for (row of filteredRows(); track row.name) {
            <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
          } @empty {
            <tr><td colspan="3" class="empty-cell">No results.</td></tr>
          }
        </tbody>
      </table>
    </div>
  </div>
  <div class="status-row">
    <span class="status-badge" [class.active]="filterRef.isActive()">
      isActive: {{ filterRef.isActive() }}
    </span>
    <span class="status-badge">{{ filteredRows().length }} / {{ totalPeople }} rows</span>
  </div>`,
    },
    {
      title: 'CngxFilter — Uncontrolled',
      subtitle: '<code>filterRef.setPredicate(fn)</code> mutates the directive\'s internal state imperatively — no bound input needed. <code>(filterChange)</code> emits the new predicate so the consumer can sync local derived state.',
      template: `
  <div
    [cngxFilter]="null"
    #filterRef2="cngxFilter"
    (filterChange)="onFilterChange($event)"
    class="filter-container"
  >
    <div class="filter-row">
      <span class="filter-label">Filter by role:</span>
      <button
        type="button"
        class="chip"
        [class.chip--active]="activeRole() === null"
        (click)="filterRef2.clear(); activeRole.set(null)"
      >All</button>
      @for (role of roles; track role) {
        <button
          type="button"
          class="chip"
          [class.chip--active]="activeRole() === role"
          (click)="filterRef2.setPredicate(rolePred(role)); activeRole.set(role)"
        >{{ role }}</button>
      }
    </div>
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Location</th></tr>
        </thead>
        <tbody>
          @for (row of uncontrolledRows(); track row.name) {
            <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
          } @empty {
            <tr><td colspan="3" class="empty-cell">No results.</td></tr>
          }
        </tbody>
      </table>
    </div>
  </div>
  <div class="status-row">
    <span class="status-badge" [class.active]="filterRef2.isActive()">
      isActive: {{ filterRef2.isActive() }}
    </span>
    <span class="status-badge">{{ uncontrolledRows().length }} / {{ totalPeople }} rows</span>
  </div>`,
    },
  ],
};
