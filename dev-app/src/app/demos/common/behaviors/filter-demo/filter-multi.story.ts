import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter — Multi',
  navLabel: 'Filter (Multi)',
  navCategory: 'data',
  apiComponents: ['CngxFilter'],
  moduleImports: [
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly totalPeople = PEOPLE.length;
  protected readonly locations = [...new Set(PEOPLE.map((p: Person) => p.location))].sort((a, b) => a.localeCompare(b));
  protected readonly roles = [...new Set(PEOPLE.map((p: Person) => p.role))].sort((a, b) => a.localeCompare(b));

  // ── Section 1: AND across dimensions ───────────────────────────────────────
  protected readonly activeLocation = signal<string | null>(null);
  protected readonly activeRole = signal<string | null>(null);
  protected readonly multiRows = signal<Person[]>(PEOPLE);

  protected setLocationFilter(filterRef: CngxFilter, loc: string | null): void {
    this.activeLocation.set(loc);
    if (loc) {
      filterRef.addPredicate('location', (p) => (p as Person).location === loc);
    } else {
      filterRef.removePredicate('location');
    }
    const pred = filterRef.predicate() as ((p: Person) => boolean) | null;
    this.multiRows.set(pred ? PEOPLE.filter(pred) : PEOPLE);
  }

  protected setRoleFilter(filterRef: CngxFilter, role: string | null): void {
    this.activeRole.set(role);
    if (role) {
      filterRef.addPredicate('role', (p) => (p as Person).role === role);
    } else {
      filterRef.removePredicate('role');
    }
    const pred = filterRef.predicate() as ((p: Person) => boolean) | null;
    this.multiRows.set(pred ? PEOPLE.filter(pred) : PEOPLE);
  }

  // ── Section 2: OR within a dimension + AND across dimensions ───────────────
  protected readonly selectedLocations = signal<Set<string>>(new Set());
  protected readonly selectedRoles = signal<Set<string>>(new Set());
  protected readonly orRows = signal<Person[]>(PEOPLE);

  protected toggleLocation(filterRef: CngxFilter, loc: string): void {
    const next = new Set(this.selectedLocations());
    if (next.has(loc)) { next.delete(loc); } else { next.add(loc); }
    this.selectedLocations.set(next);
    if (next.size > 0) {
      filterRef.addPredicate('location', (p) => next.has((p as Person).location));
    } else {
      filterRef.removePredicate('location');
    }
    const pred = filterRef.predicate() as ((p: Person) => boolean) | null;
    this.orRows.set(pred ? PEOPLE.filter(pred) : PEOPLE);
  }

  protected toggleRole2(filterRef: CngxFilter, role: string): void {
    const next = new Set(this.selectedRoles());
    if (next.has(role)) { next.delete(role); } else { next.add(role); }
    this.selectedRoles.set(next);
    if (next.size > 0) {
      filterRef.addPredicate('role', (p) => next.has((p as Person).role));
    } else {
      filterRef.removePredicate('role');
    }
    const pred = filterRef.predicate() as ((p: Person) => boolean) | null;
    this.orRows.set(pred ? PEOPLE.filter(pred) : PEOPLE);
  }

  protected clearOrFilters(filterRef: CngxFilter): void {
    filterRef.clear();
    this.selectedLocations.set(new Set());
    this.selectedRoles.set(new Set());
    this.orRows.set(PEOPLE);
  }
  `,
  sections: [
    {
      title: 'CngxFilter — Multi (addPredicate / removePredicate)',
      subtitle:
        'Each filter chip calls <code>addPredicate(key, fn)</code> or <code>removePredicate(key)</code>. ' +
        'All active predicates are AND-combined automatically. ' +
        '<code>activeCount()</code> shows how many named predicates are stacked.',
      imports: ['CngxFilter'],
      template: `
  <div [cngxFilter]="null" #filterRef="cngxFilter" class="filter-container">
    <div class="filter-row">
      <span class="filter-label">Location:</span>
      <button
        type="button"
        class="chip"
        [class.chip--active]="activeLocation() === null"
        (click)="setLocationFilter(filterRef, null)"
      >All</button>
      @for (loc of locations; track loc) {
        <button
          type="button"
          class="chip"
          [class.chip--active]="activeLocation() === loc"
          (click)="setLocationFilter(filterRef, loc)"
        >{{ loc }}</button>
      }
    </div>
    <div class="filter-row">
      <span class="filter-label">Role:</span>
      <button
        type="button"
        class="chip"
        [class.chip--active]="activeRole() === null"
        (click)="setRoleFilter(filterRef, null)"
      >All</button>
      @for (role of roles; track role) {
        <button
          type="button"
          class="chip"
          [class.chip--active]="activeRole() === role"
          (click)="setRoleFilter(filterRef, role)"
        >{{ role }}</button>
      }
    </div>
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Location</th></tr>
        </thead>
        <tbody>
          @for (row of multiRows(); track row.name) {
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
    <span class="status-badge" [class.active]="filterRef.activeCount() > 0">
      activeCount: {{ filterRef.activeCount() }}
    </span>
    <span class="status-badge">{{ multiRows().length }} / {{ totalPeople }} rows</span>
  </div>`,
    },
    {
      title: 'OR within dimension + AND across dimensions',
      subtitle:
        'Multiple values per dimension are possible by keeping a <code>Set</code> inside a single named predicate. ' +
        'Click <em>London</em> and <em>Rome</em> to see OR in action. ' +
        'Adding a role filter stacks on top as AND.',
      imports: ['CngxFilter'],
      template: `
  <div [cngxFilter]="null" #filterRef2="cngxFilter" class="filter-container">
    <div class="filter-row">
      <span class="filter-label">Location (OR):</span>
      @for (loc of locations; track loc) {
        <button
          type="button"
          class="chip"
          [class.chip--active]="selectedLocations().has(loc)"
          (click)="toggleLocation(filterRef2, loc)"
        >{{ loc }}</button>
      }
    </div>
    <div class="filter-row">
      <span class="filter-label">Role (OR):</span>
      @for (role of roles; track role) {
        <button
          type="button"
          class="chip"
          [class.chip--active]="selectedRoles().has(role)"
          (click)="toggleRole2(filterRef2, role)"
        >{{ role }}</button>
      }
    </div>
    <div class="button-row" style="margin-bottom:.75rem">
      <button type="button" (click)="clearOrFilters(filterRef2)">Clear all</button>
    </div>
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Location</th></tr>
        </thead>
        <tbody>
          @for (row of orRows(); track row.name) {
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
    <span class="status-badge" [class.active]="filterRef2.activeCount() > 0">
      activeCount: {{ filterRef2.activeCount() }}
    </span>
    <span class="status-badge">{{ orRows().length }} / {{ totalPeople }} rows</span>
  </div>`,
    },
  ],
};
