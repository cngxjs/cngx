import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSort: Controlled',
  subtitle: 'Bind <code>[cngxSortActive]</code> and <code>[cngxSortDirection]</code> to consumer signals; the inputs take precedence over the directive\'s internal state.',
  description: 'Controlled mode externalises sort state. Useful when the active sort needs to come from the URL, persist across navigation, or be settable from another part of the UI (e.g. a saved-view dropdown). The directive still emits <code>sortChange</code> on click so the consumer can route the user-driven update back into the bound signals. When neither input is bound, the directive operates uncontrolled (see Basic).',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxSort',
    'CngxSortHeader',
  ],
  moduleImports: [
    'import { CngxSort, CngxSortHeader, type SortEntry } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSort', 'CngxSortHeader'],
  setup: `
  protected readonly people = [
    { id: 1, name: 'Ada Lovelace', role: 'Engineer', age: 36 },
    { id: 2, name: 'Grace Hopper', role: 'Architect', age: 42 },
    { id: 3, name: 'Margaret Hamilton', role: 'Engineer', age: 28 },
    { id: 4, name: 'Hedy Lamarr', role: 'Inventor', age: 51 },
    { id: 5, name: 'Katherine Johnson', role: 'Mathematician', age: 38 },
  ] as const;

  protected readonly activeKey = signal<string | undefined>('name');
  protected readonly direction = signal<'asc' | 'desc' | undefined>('asc');

  protected readonly sortedRows = computed<readonly typeof this.people[number][]>(() => {
    const key = this.activeKey();
    if (!key) return this.people;
    const dir = this.direction() === 'desc' ? -1 : 1;
    return [...this.people].sort((a, b) => {
      const av = a[key as keyof typeof a];
      const bv = b[key as keyof typeof b];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  });

  protected handleSortChange(entry: SortEntry | null): void {
    this.activeKey.set(entry?.active);
    this.direction.set(entry?.direction);
  }`,
  setupChrome: `
  protected handleSortByName(): void {
    this.activeKey.set('name');
    this.direction.set('asc');
  }

  protected handleReset(): void {
    this.activeKey.set(undefined);
    this.direction.set(undefined);
  }`,
  template: `
  <table
    cngxSort
    [cngxSortActive]="activeKey()"
    [cngxSortDirection]="direction()"
    (sortChange)="handleSortChange($event)"
    #sort="cngxSort"
  >
    <thead>
      <tr>
        <th scope="col">
          <button type="button" cngxSortHeader="name" [cngxSortRef]="sort" #h1="cngxSortHeader">
            Name
            @if (h1.isActive()) { <span aria-hidden="true">{{ h1.isAsc() ? '↑' : '↓' }}</span> }
          </button>
        </th>
        <th scope="col">
          <button type="button" cngxSortHeader="role" [cngxSortRef]="sort" #h2="cngxSortHeader">
            Role
            @if (h2.isActive()) { <span aria-hidden="true">{{ h2.isAsc() ? '↑' : '↓' }}</span> }
          </button>
        </th>
        <th scope="col">
          <button type="button" cngxSortHeader="age" [cngxSortRef]="sort" #h3="cngxSortHeader">
            Age
            @if (h3.isActive()) { <span aria-hidden="true">{{ h3.isAsc() ? '↑' : '↓' }}</span> }
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      @for (row of sortedRows(); track row.id) {
        <tr>
          <td>{{ row.name }}</td>
          <td>{{ row.role }}</td>
          <td>{{ row.age }}</td>
        </tr>
      }
    </tbody>
  </table>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleSortByName()">Sort by name asc</button>
    <button type="button" (click)="handleReset()">Reset</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">activeKey()</span>
      <span class="event-value">{{ activeKey() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">direction()</span>
      <span class="event-value">{{ direction() ?? '-' }}</span>
    </div>
  </div>`,
};
