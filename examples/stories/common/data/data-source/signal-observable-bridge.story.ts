import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDataSource — Signal → Observable Bridge',
  subtitle: '<code>injectDataSource(signal)</code> is a thin CDK <code>DataSource</code> wrapper. Every time the signal changes, <code>connect()</code> emits a new value. Use <code>toSignal(ds.connect())</code> to drive a template directly. Zero logic — consumer wires up sort/filter/search via a <code>computed()</code> passed as the signal.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'async-state'],
  apiComponents: [
    'CngxPaginate',
    'CngxMatPaginator',
  ],
  moduleImports: [
    'import { toSignal } from \'@angular/core/rxjs-interop\';',
    'import { injectDataSource } from \'@cngx/common\';',
    'import { PEOPLE, type Person } from \'../../../../fixtures\';',
  ],
  setup: `private readonly items = signal(PEOPLE);
  private readonly ds = injectDataSource(this.items);
  protected readonly rows = toSignal(this.ds.connect(), { initialValue: [] as Person[] });
  protected shuffle(): void {
    this.items.update((list) => [...list].sort(() => Math.random() - 0.5));
  }
  protected reset(): void {
    this.items.set(PEOPLE);
  }`,
  template: `
  <div class="table-wrap">
    <table class="demo-table">
      <thead>
        <tr><th>Name</th><th>Role</th><th>Location</th></tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.name) {
          <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
        }
      </tbody>
    </table>
  </div>
  <div class="button-row">
    <button type="button" (click)="shuffle()">Shuffle</button>
    <button type="button" (click)="reset()">Reset</button>
  </div>`,
};
