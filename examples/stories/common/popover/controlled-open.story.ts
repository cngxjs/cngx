import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Controlled Open',
  subtitle: 'Bind <code>[cngxPopoverOpen]</code> to drive the popover reactively — no <code>show()</code>/<code>hide()</code> calls needed.',
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
  <div style="display:flex;gap:12px;align-items:center;padding-top:20px">
    <label [cngxPopoverTrigger]="ctrl"
           style="display:flex;align-items:center;gap:6px;font-size:0.875rem;cursor:pointer">
      <input type="checkbox" #chk (change)="0" />
      Show popover
    </label>
    <div cngxPopover #ctrl="cngxPopover" [cngxPopoverOpen]="chk.checked" placement="bottom"
         [exclusive]="false"
         style="padding:8px 12px;font-size:0.8125rem">
      Controlled by checkbox
    </div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ ctrl.state() }}</span>
    </div>
  </div>`,
};
