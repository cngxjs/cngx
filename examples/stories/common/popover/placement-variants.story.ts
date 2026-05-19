import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Placement Variants',
  subtitle: 'CSS Anchor Positioning handles all placement. No JavaScript repositioning needed.',
  description: 'Signal-driven state machine for the native Popover API. CSS Anchor Positioning, transition-aware lifecycle, no CDK Overlay dependency.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxPopover',
    'CngxPopoverTrigger',
  ],
  moduleImports: [
    'import { CngxPopover, CngxPopoverTrigger } from \'@cngx/common/popover\';',
    'import type { PopoverPlacement } from \'@cngx/common/popover\';',
  ],
  imports: ['CngxPopover', 'CngxPopoverTrigger'],
  setup: `protected readonly placements: PopoverPlacement[] = ['bottom', 'bottom-start', 'bottom-end', 'top', 'left', 'right'];`,
  template: `
  <div style="display:flex;gap:16px;flex-wrap:wrap;padding:40px 0">
    @for (p of placements; track p) {
      <div>
        <button [cngxPopoverTrigger]="plPop" (click)="plPop.toggle()" class="chip">
          {{ p }}
        </button>
        <div cngxPopover #plPop="cngxPopover" [placement]="p"
             style="padding:8px 12px;font-size:0.8125rem">
          Popover at {{ p }}
        </div>
      </div>
    }
  </div>`,
};
