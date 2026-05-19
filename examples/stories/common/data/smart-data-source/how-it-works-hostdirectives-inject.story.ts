import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'How It Works — hostDirectives + inject()',
  subtitle: 'The key is calling <code>injectSmartDataSource()</code> inside a component whose host element has <code>[cngxSort]</code> / <code>[cngxFilter]</code> as <code>hostDirectives</code>. The factory uses optional <code>inject()</code> to auto-discover them.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  apiComponents: [
    'CngxSort',
    'CngxFilter',
    'CngxPaginate',
  ],
  moduleImports: [
    'import { toSignal } from \'@angular/core/rxjs-interop\';',
    'import { CngxFilter, CngxSort, injectSmartDataSource } from \'@cngx/common\';',
    'import { PEOPLE, type Person } from \'../../../../fixtures\';',
  ],
  hostDirectives: ['CngxSort', 'CngxFilter'],
  setup: `protected readonly sort = inject(CngxSort, { host: true });
  protected readonly filter = inject(CngxFilter<Person>, { host: true });
  private readonly items = signal(PEOPLE);
  private readonly ds = injectSmartDataSource(this.items);
  protected readonly rows = toSignal(this.ds.connect(), { initialValue: [] as Person[] });`,
  template: `
  <pre class="code-block"><code>@Component(&#123;
  selector: 'my-table',
  hostDirectives: [
    &#123; directive: CngxSort &#125;,
    &#123; directive: CngxFilter &#125;,
  ],
&#125;)
class MyTableComponent &#123;
  // inject() finds the hostDirective instances automatically
  protected readonly sort   = inject(CngxSort,   &#123; host: true &#125;);
  protected readonly filter = inject(CngxFilter, &#123; host: true &#125;);

  private readonly items = signal(data);

  // SmartDataSource discovers CngxSort + CngxFilter via inject()
  // because we&apos;re inside the component&apos;s injection context
  private readonly ds = injectSmartDataSource(this.items);

  protected readonly rows = toSignal(this.ds.connect(), &#123; initialValue: [] &#125;);
&#125;</code></pre>`,
};
