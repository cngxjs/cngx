import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Content Visibility (CSS-only)',
  subtitle: 'Zero-JS optimization via <code>content-visibility: auto</code>. The browser skips rendering of off-screen items. Complementary to the recycler — can be used standalone or together. Import the SCSS mixin from <code>@cngx/common/data</code>.',
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
  <pre class="code-block"><code>// SCSS mixin
&#64;use '&#64;cngx/common/data/recycler/content-visibility' as cv;

.item {{ '{' }}
  &#64;include cv.cngx-content-visibility(48px);
{{ '}' }}

// Generates:
// content-visibility: auto;
// contain-intrinsic-size: auto 48px;</code></pre>`,
};
