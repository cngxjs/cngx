import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTooltip: Disabled state',
  subtitle:
    'Set <code>[enabled]="false"</code> to suppress the tooltip. The directive also clears <code>aria-describedby</code> on the trigger.',
  description:
    'The disabled trigger keeps the directive attached but the <code>ariaDescribedBy</code> computed resolves to <code>null</code>, so the button surface announces no extra description. The enabled-state effect also closes any open instance the moment the input flips off, preventing a stale tooltip from outliving the toggle.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Tooltip',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',
    },
  ],
  apiComponents: ['CngxTooltip'],
  moduleImports: ["import { CngxTooltip } from '@cngx/common/popover';"],
  imports: ['CngxTooltip'],
  template: `
  <div class="demo-popover-stage--tall" style="display:flex;gap:16px;align-items:center">
    <button cngxTooltip="This tooltip is active" class="chip">Enabled</button>
    <button cngxTooltip="This tooltip is suppressed" [enabled]="false"
            class="chip demo-tooltip-disabled-chip">Disabled</button>
  </div>`,
};
