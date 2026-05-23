import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTooltip: Programmatic control',
  subtitle:
    '<code>[triggers]="\'manual\'"</code> opts the host out of the hover/focus listeners. <code>#tip="cngxTooltip"</code> exposes the directive instance for <code>show()</code> / <code>hide()</code> and the lifecycle <code>state()</code> signal.',
  description:
    'In manual mode the directive ignores hover and focus on the trigger; only <code>show()</code> / <code>hide()</code> open and close the tooltip. Escape still dismisses an open tooltip for keyboard a11y. Useful for app-state driven tooltips (validation hints, onboarding callouts) where pointer interaction should not interfere.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxTooltip'],
  moduleImports: ["import { CngxTooltip } from '@cngx/common/popover';"],
  imports: ['CngxTooltip'],
  template: `  <div class="demo-popover-stage--tall"
       style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <button cngxTooltip="Programmatically controlled" [triggers]="'manual'" #tip="cngxTooltip"
            class="chip">
      Target
    </button>
    <button (click)="tip.show()" class="chip" type="button">Show</button>
    <button (click)="tip.hide()" class="chip" type="button">Hide</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ tip.state() }}</span>
    </div>
  </div>`,
};
