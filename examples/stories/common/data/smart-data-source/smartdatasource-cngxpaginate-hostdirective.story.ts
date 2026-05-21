import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'SmartDataSource + CngxPaginate (hostDirective)',
  subtitle: 'Adding <code>CngxPaginate</code> as a third <code>hostDirective</code> enables automatic pagination in <code>CngxSmartDataSource</code>. The data source applies the page slice <em>after</em> sort. <code>ds.filteredCount()</code> gives the pre-pagination count to bind as <code>[total]</code> on the paginator. The consumer re-exports the <code>total</code> input from the hostDirective so the parent can set it.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  apiComponents: [
    'CngxSmartDataSource',
    'CngxSort',
    'CngxFilter',
    'CngxPaginate',
  ],
  template: `
  <pre class="code-block"><code>@Component(&#123;
  selector: 'my-table',
  hostDirectives: [
    &#123; directive: CngxSort &#125;,
    &#123; directive: CngxFilter &#125;,
    // Add CngxPaginate - SmartDataSource discovers it automatically
    &#123; directive: CngxPaginate, inputs: ['total'] &#125;,
  ],
&#125;)
class MyTableComponent &#123;
  protected readonly sort    = inject(CngxSort,    &#123; host: true &#125;);
  protected readonly filter  = inject(CngxFilter,  &#123; host: true &#125;);
  protected readonly paginate = inject(CngxPaginate, &#123; host: true &#125;);

  private readonly items = signal(data);

  // Auto-discovers CngxSort, CngxFilter, AND CngxPaginate
  private readonly ds = injectSmartDataSource(this.items);

  // Expose filteredCount (post-filter, pre-paginate) for the paginator
  protected readonly filteredCount = this.ds.filteredCount;
&#125;

// Parent template:
// &lt;my-table [total]="myFilteredCount()"&gt;
//   &lt;div cngxPaginate #pg="cngxPaginate"&gt;
//     &lt;cngx-mat-paginator [cngxPaginateRef]="pg" /&gt;
//   &lt;/div&gt;
// &lt;/my-table&gt;</code></pre>`,
};
