import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'With CngxAsyncState — Skeleton First Load',
  subtitle: 'The recycler derives <code>isLoading</code>, <code>showSkeleton</code>, and <code>isEmpty</code> from a <code>CngxAsyncState</code> source — same pattern as <code>CngxCardGrid</code> and <code>CngxTreetable</code>. Skeleton slots fill the viewport height automatically.',
  description: 'Signal-based virtualizer for long lists. Items outside the viewport are removed from the DOM. Consumer renders with @for and two spacer containers.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern', 'async-state'],
  apiComponents: [
    'CngxRecycler',
    'CngxMeasure',
    'CngxVirtualItem',
    'CngxRecyclerAnnouncer',
  ],
  moduleImports: [
    'import { injectRecycler } from \'@cngx/common/data\';',
  ],
  setup: `protected readonly allItems = signal(
    Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      name: 'Item ' + (i + 1),
      description: 'Description for item ' + (i + 1),
    })),
  );
  protected readonly recycler = injectRecycler({
    scrollElement: '.recycler-scroll',
    totalCount: () => this.allItems().length,
    estimateSize: 48,
    overscan: 10,
  });`,
  template: `
  <pre class="code-block"><code>// With CngxAsyncState integration
readonly state = injectAsyncState(() => this.api.getAll());

readonly recycler = injectRecycler({{ '{' }}
  scrollElement: '.scroll',
  totalCount: () => (this.state.data() ?? []).length,
  estimateSize: 64,
  state: this.state,         // drives isLoading, isRefreshing, isEmpty
  skeletonDelay: 300,        // fast loads never show skeleton
{{ '}' }});

readonly visible = this.recycler.sliced(
  computed(() => this.state.data() ?? [])
);

// Template:
// &#64;if (recycler.showSkeleton()) {{ '{' }}
//   &#64;for (_ of skeletonRange(recycler.skeletonSlots()); track $index) {{ '{' }}
//     &lt;div class="skeleton-item" aria-hidden="true"&gt;&lt;/div&gt;
//   {{ '}' }}
// {{ '}' }} &#64;else {{ '{' }}
//   &#64;for (item of visible(); track item.id) {{ '{' }} ... {{ '}' }}
// {{ '}' }}</code></pre>`,
};
