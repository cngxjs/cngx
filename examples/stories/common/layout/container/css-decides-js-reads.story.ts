import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContainer: CSS decides, JS reads',
  subtitle:
    'The breakpoint lives once, in a <code>@container</code> rule. It writes <code>--demo-columns</code> on a descendant; <code>property()</code> reads the resolved value as a signal. TypeScript never parses a length.',
  description:
    'A [cngxContainer] host with a native resize handle. Two @container rules at 20rem and 30rem set --demo-columns on the inner grid and drive its grid-template-columns. The component reads that same property through container.property(name, element), so the rendered summary branches on exactly the value CSS resolved - no second threshold in TypeScript. Note the property is written on the grid, not on the container: a container query resolves against an ancestor container, so a rule whose subject is the container itself would never match.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxContainer'],
  moduleImports: ["import { CngxContainer } from '@cngx/common';"],
  imports: ['CngxContainer'],
  setup: `protected readonly container = viewChild(CngxContainer);
  protected readonly gridRef = viewChild<ElementRef<HTMLElement>>('grid');

  // One source: the @container rule resolved --demo-columns, this reads it.
  protected readonly columns = computed(() => {
    const container = this.container();
    const grid = this.gridRef();
    if (!container || !grid) {
      return '';
    }
    return container.property('--demo-columns', grid.nativeElement)();
  });`,
  template: `  <div cngxContainer class="demo-cq" style="resize: horizontal; overflow: auto; width: 280px; max-width: 100%;">
    <div #grid class="demo-cq__grid">
      <div class="demo-cq__cell">One</div>
      <div class="demo-cq__cell">Two</div>
      <div class="demo-cq__cell">Three</div>
    </div>

    @switch (columns()) {
      @case ('3') {
        <p class="demo-cq__summary">Wide container: three columns side by side.</p>
      }
      @case ('2') {
        <p class="demo-cq__summary">Medium container: two columns, third wraps.</p>
      }
      @case ('1') {
        <p class="demo-cq__summary">Narrow container: stacked.</p>
      }
      @default {
        <p class="demo-cq__summary">Measuring...</p>
      }
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">inlineSize</span>
      <span class="event-value">{{ container()?.inlineSize() }} px</span>
    </div>
    <div class="event-row">
      <span class="event-label">--demo-columns</span>
      <span class="event-value">{{ columns() || '(not measured)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isReady</span>
      <span class="event-value">{{ container()?.isReady() }}</span>
    </div>
  </div>`,
};
