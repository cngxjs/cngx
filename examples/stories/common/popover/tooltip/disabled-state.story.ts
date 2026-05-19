import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled State',
  subtitle: 'Set <code>[enabled]="false"</code> to disable the tooltip. The <code>aria-describedby</code> is cleared.',
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
  <div style="display:flex;gap:16px;align-items:center;padding-top:40px">
    <button cngxTooltip="This tooltip is active" class="chip">Enabled</button>
    <button cngxTooltip="This tooltip is suppressed" [enabled]="false" class="chip"
            style="opacity:0.5">Disabled</button>
  </div>`,
};
