import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuTrigger: esc-only dismissal',
  subtitle:
    'Component-scoped opt-out of the outside-click and blur dismissal defaults. Only Escape closes the menu - useful for tutorial overlays, guided tours, and menus that must survive incidental focus loss.',
  description:
    'The menu defaults (outside-click and blur both dismiss) are inverted here via <code>provideMenuConfigAt(withDismissOnOutsideClick(false), withDismissOnBlur(false))</code> in <code>viewProviders</code>. The popover\'s own <code>closeOnEscape</code> still owns the actual close path; the factory continues to record <code>\'escape\'</code> as <code>lastDismissSource</code>. Click outside the menu or switch tabs - the menu stays open. Press Escape - the menu closes.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Button Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
  ],
  apiComponents: ['CngxMenuTrigger', 'CngxMenu', 'CngxMenuItem'],
  moduleImports: [
    "import { CngxMenu, CngxMenuItem, CngxMenuTrigger, provideMenuConfigAt, withDismissOnBlur, withDismissOnOutsideClick } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: ['CngxMenu', 'CngxMenuItem', 'CngxMenuTrigger', 'CngxPopover', 'CngxPopoverTrigger'],
  viewProviders: [
    'provideMenuConfigAt(withDismissOnOutsideClick(false), withDismissOnBlur(false))',
  ],
  setup: `protected readonly lastAction = signal<string | null>(null);`,
  template: `  <button
    type="button"
    [cngxMenuTrigger]="menu"
    [cngxPopoverTrigger]="pop"
    [haspopup]="'menu'"
    [popover]="pop"
    (click)="pop.toggle()"
    #trigger="cngxMenuTrigger"
    aria-label="Tutorial menu"
  >
    Open tutorial menu
  </button>
  <div cngxPopover #pop="cngxPopover">
    <ul
      cngxMenu
      [label]="'Tutorial steps'"
      tabindex="0"
      (itemActivated)="lastAction.set($any($event))"
      #menu="cngxMenu"
    >
      <li cngxMenuItem value="step-1">Step 1 - locate the toolbar</li>
      <li cngxMenuItem value="step-2">Step 2 - open the inspector</li>
      <li cngxMenuItem value="step-3">Step 3 - apply the rule</li>
      <li cngxMenuItem value="finish">Finish tour</li>
    </ul>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Open</span>
      <span class="event-value">{{ trigger.isOpen() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last dismissal source</span>
      <span class="event-value">{{ trigger.lastDismissSource() ?? '-' }}</span>
    </div>
  </div>`,
};
