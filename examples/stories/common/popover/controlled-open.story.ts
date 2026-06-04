import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopover: Controlled open',
  subtitle:
    'Bind <code>[cngxPopoverOpen]</code> to drive the popover reactively. No <code>show()</code> / <code>hide()</code> calls in the consumer.',
  description:
    'The checkbox state flows directly into <code>[cngxPopoverOpen]</code>; the directive\'s open effect handles the show/hide round-trip. <code>[exclusive]="false"</code> keeps this popover from auto-closing other popovers in the same document, so it can coexist with a global popover stack.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxPopover', 'CngxPopoverTrigger'],
  moduleImports: ["import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';"],
  imports: ['CngxPopover', 'CngxPopoverTrigger'],
  template: `  <div class="demo-popover-stage" style="display:flex;gap:12px;align-items:center">
    <label [cngxPopoverTrigger]="ctrl" class="demo-popover-control-label">
      <input type="checkbox" #chk (change)="0" />
      Show popover
    </label>
    <div cngxPopover #ctrl="cngxPopover" [cngxPopoverOpen]="chk.checked" placement="bottom"
         [exclusive]="false" class="demo-popover-surface">
      Controlled by checkbox
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ ctrl.state() }}</span>
    </div>
  </div>`,
};
