import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopover: Click popover',
  subtitle:
    'The consumer binds <code>(click)="pop.toggle()"</code>. <code>CngxPopoverTrigger</code> only handles ARIA wiring.',
  description:
    'Click-triggered popover with the default <code>mode="manual"</code>. The button uses <code>haspopup="menu"</code> because the popover hosts a native <code>&lt;menu&gt;</code>; CngxPopoverTrigger projects that value as <code>aria-haspopup</code> alongside <code>aria-expanded</code> and <code>aria-controls</code>. <code>[restoreFocus]="true"</code> sends focus back to the Actions button after a menu item closes the popover. Each menu item closes the popover via <code>pop.hide()</code>.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Button',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
    {
      label: 'WCAG 2.4.3 Focus Order',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
    },
  ],
  apiComponents: ['CngxPopover', 'CngxPopoverTrigger'],
  moduleImports: ["import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';"],
  imports: ['CngxPopover', 'CngxPopoverTrigger'],
  setup: `protected readonly menuItems = signal(['Edit', 'Duplicate', 'Archive', 'Delete']);`,
  template: `  <div class="demo-popover-stage">
    <button [cngxPopoverTrigger]="pop" [restoreFocus]="true" (click)="pop.toggle()" class="chip"
            haspopup="menu">
      Actions
    </button>
    <div cngxPopover #pop="cngxPopover" placement="bottom-start" class="demo-popover-surface">
      <menu class="demo-popover-menu">
        @for (item of menuItems(); track item) {
          <li>
            <button
              type="button"
              class="demo-popover-menu-item"
              (click)="pop.hide()">
              {{ item }}
            </button>
          </li>
        }
      </menu>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
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
