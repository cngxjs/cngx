import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Search',
  navLabel: 'Search',
  navCategory: 'interactive',
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
      title: 'CngxSearch',
      subtitle: '<code>input[cngxSearch]</code> debounces the native <code>input</code> event and emits <code>(searchChange)</code> after the delay. <code>[debounceMs]</code> controls the delay (default 300 ms). Consumer drives filtering via a <code>computed()</code>.',
      imports: ['CngxSearch'],
      template: `
  <div class="search-row">
    <input
      cngxSearch
      [debounceMs]="200"
      (searchChange)="searchTerm.set($event)"
      placeholder="Search name, role, or location…"
      class="search-input"
    />
    @if (searchTerm()) {
      <span class="term-badge">{{ searchTerm() }}</span>
    }
  </div>
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
      title: 'CngxSearch — Zero Debounce',
      subtitle: 'Setting <code>[debounceMs]="0"</code> makes the search synchronous — every keystroke fires immediately. Useful when the dataset is small or filtering is cheap.',
      template: `
  <div class="search-row">
    <input
      cngxSearch
      [debounceMs]="0"
      (searchChange)="searchTerm.set($event)"
      placeholder="Instant search…"
      class="search-input"
    />
    @if (searchTerm()) {
      <span class="term-badge">{{ searchTerm() }}</span>
    }
  </div>
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
  </div>`,
    },
  ],
};
