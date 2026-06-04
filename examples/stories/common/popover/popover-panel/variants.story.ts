import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: Variants',
  subtitle:
    'The <code>variant</code> input is a free-form string mapped to <code>cngx-popover-panel--{variant}</code>. Five are pre-themed: <code>default</code>, <code>info</code>, <code>success</code>, <code>warning</code>, <code>danger</code>.',
  description:
    'Each chip opens a panel with a different variant. The library ships only the five pre-themed classes; any additional value (for example <code>variant="brand"</code>) just renders an extra modifier class the consumer can style. <code>showArrow</code> and <code>showClose</code> are toggled on per panel so the variant accent is visible on both the arrow tip and the close button.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxPopoverPanel'],
  moduleImports: [
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody } from '@cngx/common/popover';",
  ],
  imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody'],
  template: `
  <div class="demo-popover-stage" style="display:flex;gap:12px;flex-wrap:wrap">
    @for (v of ['default', 'info', 'success', 'warning', 'danger']; track v) {
      <div>
        <button type="button" [cngxPopoverTrigger]="vp.popover" (click)="vp.popover.toggle()" class="chip">{{ v }}</button>
        <cngx-popover-panel #vp [variant]="v" [showClose]="true" [showArrow]="true" placement="bottom">
          <span cngxPopoverHeader>{{ v }} panel</span>
          <p cngxPopoverBody>This is a {{ v }} popover panel with arrow and close button.</p>
        </cngx-popover-panel>
      </div>
    }
  </div>`,
};
