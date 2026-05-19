import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Escape & Mode',
  subtitle: 'Set <code>[closeOnEscape]="false"</code> to prevent Escape dismiss. Set <code>mode="auto"</code> for browser-native light dismiss.',
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
  ],
  imports: ['CngxPopover', 'CngxPopoverTrigger'],
  template: `
  <div style="display:flex;gap:16px;flex-wrap:wrap;padding-top:20px">
    <div>
      <button [cngxPopoverTrigger]="noEsc" (click)="noEsc.toggle()" class="chip">
        No Escape
      </button>
      <div cngxPopover #noEsc="cngxPopover" [closeOnEscape]="false" placement="bottom"
           style="padding:8px 12px;font-size:0.8125rem">
        Escape won't close this. Click the button again.
      </div>
    </div>
    <div>
      <button [cngxPopoverTrigger]="autoPop" (click)="autoPop.toggle()" class="chip">
        Auto mode
      </button>
      <div cngxPopover #autoPop="cngxPopover" mode="auto" placement="bottom"
           style="padding:8px 12px;font-size:0.8125rem">
        Click outside to dismiss (browser light dismiss).
      </div>
    </div>
  </div>`,
};
