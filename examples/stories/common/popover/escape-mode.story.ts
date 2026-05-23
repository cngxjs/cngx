import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopover: Escape mode',
  subtitle:
    'Two opt-outs from the default behaviour: <code>[closeOnEscape]="false"</code> suppresses the Escape dismiss; <code>mode="auto"</code> swaps in the browser\'s native light-dismiss.',
  description:
    'The first popover keeps Escape inside its own content - useful when the popover hosts its own Escape handler such as a nested combobox. The second swaps the popover attribute from <code>"manual"</code> to <code>"auto"</code>, delegating outside-click dismissal to the browser. Either configuration leaves the global Escape stack and ARIA wiring untouched.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxPopover', 'CngxPopoverTrigger'],
  moduleImports: ["import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';"],
  imports: ['CngxPopover', 'CngxPopoverTrigger'],
  template: `
  <div class="demo-popover-stage" style="display:flex;gap:16px;flex-wrap:wrap">
    <div>
      <button [cngxPopoverTrigger]="noEsc" (click)="noEsc.toggle()" class="chip">
        No Escape
      </button>
      <div cngxPopover #noEsc="cngxPopover" [closeOnEscape]="false" placement="bottom"
           class="demo-popover-surface">
        Escape won't close this. Click the button again.
      </div>
    </div>
    <div>
      <button [cngxPopoverTrigger]="autoPop" (click)="autoPop.toggle()" class="chip">
        Auto mode
      </button>
      <div cngxPopover #autoPop="cngxPopover" mode="auto" placement="bottom"
           class="demo-popover-surface">
        Click outside to dismiss (browser light dismiss).
      </div>
    </div>
  </div>`,
};
