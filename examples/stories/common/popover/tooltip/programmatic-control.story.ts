import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Programmatic Control',
  subtitle: 'Use <code>#tip="cngxTooltip"</code> to access <code>show()</code>, <code>hide()</code>, and <code>state()</code>.',
  description: 'String-input tooltip directive using the native Popover API. CSS Anchor Positioning, WCAG 1.4.13 compliant, SR-friendly.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxTooltip',
  ],
  moduleImports: [
    'import { CngxTooltip } from \'@cngx/common/popover\';',
  ],
  imports: ['CngxTooltip'],
  template: `  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding-top:40px">
    <button cngxTooltip="Programmatically controlled" #tip="cngxTooltip" class="chip">
      Target
    </button>
    <button (click)="tip.show()" class="chip" type="button">Show</button>
    <button (click)="tip.hide()" class="chip" type="button">Hide</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ tip.state() }}</span>
    </div>
  </div>`,
};
