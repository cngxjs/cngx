import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Variants',
  subtitle: 'The <code>variant</code> input is a free-form string mapped to CSS class <code>cngx-popover-panel--{variant}</code>. Five are pre-themed: <code>default</code>, <code>info</code>, <code>success</code>, <code>warning</code>, <code>danger</code>.',
  description: 'Rich popover molecule with header/body/footer slots, variant styling, arrow, close button, content state templates, and async action buttons.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: [
    'CngxPopoverPanel',
    'CngxPopoverAction',
  ],
  moduleImports: [
    'import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody } from \'@cngx/common/popover\';',
  ],
  imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody'],
  template: `
  <div style="display:flex;gap:12px;flex-wrap:wrap;padding-top:20px">
    @for (v of ['default', 'info', 'success', 'warning', 'danger']; track v) {
      <div>
        <button [cngxPopoverTrigger]="vp.popover" (click)="vp.popover.toggle()" class="chip">{{ v }}</button>
        <cngx-popover-panel #vp [variant]="v" [showClose]="true" [showArrow]="true" placement="bottom">
          <span cngxPopoverHeader>{{ v }} panel</span>
          <p cngxPopoverBody>This is a {{ v }} popover panel with arrow and close button.</p>
        </cngx-popover-panel>
      </div>
    }
  </div>`,
};
