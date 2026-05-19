import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom Delay',
  subtitle: 'Set <code>[tooltipDelay]</code> for open delay and <code>[closeDelay]</code> for close delay.',
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
  template: `
  <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding-top:40px">
    <button cngxTooltip="Instant tooltip" [tooltipDelay]="0" class="chip">No delay</button>
    <button cngxTooltip="Slow tooltip (1s)" [tooltipDelay]="1000" class="chip">1s delay</button>
    <button cngxTooltip="Sticky tooltip" [closeDelay]="500" class="chip">500ms close delay</button>
  </div>`,
};
