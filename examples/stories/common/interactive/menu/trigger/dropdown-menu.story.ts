import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuTrigger: dropdown menu',
  subtitle:
    'ArrowDown / Enter / Space opens the menu, Escape closes it. Arrow keys move the active descendant, typeahead jumps to the next matching label, activation always closes the menu.',
  description:
    'Button that pairs with a <code>CngxMenu</code> inside a <code>CngxPopover</code>. The trigger holds keyboard focus while the menu is open; the menu drives <code>aria-activedescendant</code> through its <code>CngxActiveDescendant</code> host directive. Activation always closes (menu semantics); focus is restored to the trigger after close. <code>pointerdown</code> outside the popover and window <code>blur</code> dismiss by default; <code>Escape</code> is owned by <code>CngxPopover</code>.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Button Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: ['CngxMenuTrigger', 'CngxMenu', 'CngxMenuItem'],
  moduleImports: [
    "import { CngxMenu, CngxMenuItem, CngxMenuTrigger } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: ['CngxMenu', 'CngxMenuItem', 'CngxMenuTrigger', 'CngxPopover', 'CngxPopoverTrigger'],
  setup: `protected readonly lastAction = signal<string | null>(null);`,
  template: `  <button
    type="button"
    [cngxMenuTrigger]="menu"
    [cngxPopoverTrigger]="pop"
    [haspopup]="'menu'"
    [popover]="pop"
    (click)="pop.toggle()"
    #trigger="cngxMenuTrigger"
    aria-label="Actions menu"
  >
    Actions
  </button>
  <div cngxPopover #pop="cngxPopover">
    <ul
      cngxMenu
      [label]="'File actions'"
      tabindex="0"
      (itemActivated)="lastAction.set($any($event))"
      #menu="cngxMenu"
    >
      <li cngxMenuItem value="new">New</li>
      <li cngxMenuItem value="open">Open...</li>
      <li cngxMenuItem value="save">Save</li>
      <li cngxMenuItem value="close">Close</li>
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
  </div>`,
};
