import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRecycler: Content-visibility CSS-only',
  subtitle: 'Zero-JS optimization via <code>content-visibility: auto</code>. The browser skips rendering of off-screen items. Complementary to the recycler; can be used standalone or together. Import the SCSS mixin from <code>@cngx/common/data</code>.',
  description: 'Zero-JS virtualization via the cngx-content-visibility SCSS mixin. Off-screen rows <em>stay in</em> the DOM but skip layout and paint, so the recycler is optional. Use alone or alongside injectRecycler().',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  setup: `protected readonly cvItems = signal(
    Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: 'Item ' + (i + 1),
    })),
  );`,
  setupChrome: `  protected readonly scssExample = ['// SCSS mixin', "@use '@cngx/common/data/recycler/content-visibility' as cv;", '', '.item {', '  @include cv.cngx-content-visibility(48px);', '}', '', '// Generates:', '// content-visibility: auto;', '// contain-intrinsic-size: auto 48px;'].join('\\n');`,
  template: `  <div class="demo-scroll-frame" role="list" aria-label="Demo items"
       style="height:400px;overflow-y:auto">
    @for (item of cvItems(); track item.id) {
      <div role="listitem" class="demo-scroll-row demo-cv-item"
           style="height:48px">
        <strong>{{ item.name }}</strong>
      </div>
    }
  </div>`,
  templateChromeBefore: `<pre class="code-block" style="margin-bottom:8px"><code>{{ scssExample }}</code></pre>`,
};
