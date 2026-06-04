import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTooltip: Custom delay',
  subtitle:
    'Set <code>[tooltipDelay]</code> for the open debounce and <code>[closeDelay]</code> for the close debounce.',
  description:
    'Three triggers reconfigure the open/close timing. <code>[tooltipDelay]="0"</code> opens on the first pointer enter or focus without debounce; <code>[tooltipDelay]="1000"</code> waits a full second before opening on hover; <code>[closeDelay]="500"</code> keeps the tooltip visible long enough that the cursor can traverse from trigger to tooltip without auto-dismissing.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxTooltip'],
  moduleImports: ["import { CngxTooltip } from '@cngx/common/popover';"],
  imports: ['CngxTooltip'],
  template: `
  <div class="demo-popover-stage--tall" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
    <button type="button" cngxTooltip="Instant tooltip" [tooltipDelay]="0" class="chip">No delay</button>
    <button type="button" cngxTooltip="Slow tooltip (1s)" [tooltipDelay]="1000" class="chip">1s delay</button>
    <button type="button" cngxTooltip="Sticky tooltip" [closeDelay]="500" class="chip">500ms close delay</button>
  </div>`,
};
