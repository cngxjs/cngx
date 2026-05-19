import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Usage Pattern — Consumer Wires It Up',
  subtitle: 'Pass a <code>computed()</code> as the signal to get sort + filter + search for free. The DataSource itself has zero logic — it just bridges whatever the signal emits.',
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
  protected readonly rows = toSignal(this.ds.connect(), { initialValue: [] as Person[] });`,
  template: `
  <pre class="code-block"><code>// In your component:
private readonly raw   = signal(data);
private readonly term  = signal('');
private readonly sort  = signal&lt;SortState | null&gt;(null);

private readonly processed = computed(() => &#123;
  let list = this.raw();
  const t = this.term();
  const s = this.sort();
  if (t) list = list.filter(p => p.name.includes(t));
  if (s) list = [...list].sort(/* ... */);
  return list;
&#125;);

private readonly ds   = injectDataSource(this.processed);
protected readonly rows = toSignal(this.ds.connect(), &#123; initialValue: [] &#125;);</code></pre>`,
};
