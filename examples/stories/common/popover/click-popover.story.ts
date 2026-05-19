import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Click Popover',
  subtitle: 'The consumer binds <code>(click)="pop.toggle()"</code> — the trigger directive only handles ARIA.',
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
  setup: `protected readonly menuItems = signal(['Edit', 'Duplicate', 'Archive', 'Delete']);`,
  template: `
  <div style="padding-top:20px">
    <button [cngxPopoverTrigger]="pop" (click)="pop.toggle()" class="chip"
            haspopup="menu">
      Actions
    </button>
    <div cngxPopover #pop="cngxPopover" placement="bottom-start"
         style="list-style:none;margin:0">
      <menu style="margin:0;padding:4px 0;min-width:140px">
        @for (item of menuItems(); track item) {
          <li>
            <button (click)="pop.hide()" type="button"
                    style="display:block;width:100%;padding:8px 16px;border:none;background:none;
                           text-align:left;cursor:pointer;font:inherit">
              {{ item }}
            </button>
          </li>
        }
      </menu>
    </div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ pop.state() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isVisible</span>
      <span class="event-value">{{ pop.isVisible() }}</span>
    </div>
  </div>`,
};
