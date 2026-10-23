import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Composition: Menu button',
  subtitle: 'A <code>cngxButton</code> that opens a menu: <code>cngxMenuTrigger</code> plus <code>cngxPopoverTrigger</code> on the same element.',
  description: 'There is no menu-button class. The button keeps its own look and states, <code>cngxMenuTrigger</code> adds the keyboard model and <code>aria-haspopup</code> / <code>aria-expanded</code>, <code>cngxPopoverTrigger</code> anchors the panel to the button. ArrowDown, Enter or Space opens the menu and highlights the first item; the button keeps focus and drives <code>aria-activedescendant</code>. Escape closes the menu and focus stays on the button. The caret is a <code>cngx-icon</code> in <code>cngxButtonEnd</code>, decorative by default and so hidden from assistive technology.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Button Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
  ],
  apiComponents: ['CngxButton', 'CngxButtonEnd', 'CngxIcon', 'CngxMenuTrigger', 'CngxMenu', 'CngxMenuItem', 'CngxPopoverTrigger'],
  moduleImports: [
    "import { CngxButton, CngxButtonEnd } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxMenu, CngxMenuItem, CngxMenuTrigger } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: ['CngxButton', 'CngxButtonEnd', 'CngxIcon', 'CngxMenu', 'CngxMenuItem', 'CngxMenuTrigger', 'CngxPopover', 'CngxPopoverTrigger'],
  setup: `protected readonly lastFormat = signal<string | null>(null);`,
  template: `
  <button
    cngxButton="outline"
    [cngxMenuTrigger]="menu"
    [cngxPopoverTrigger]="pop"
    [haspopup]="'menu'"
    [popover]="pop"
    (click)="pop.toggle()"
    #trigger="cngxMenuTrigger"
  >
    Export
    <cngx-icon cngxButtonEnd>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </cngx-icon>
  </button>
  <div cngxPopover placement="bottom-start" #pop="cngxPopover">
    <ul
      cngxMenu
      [label]="'Export format'"
      tabindex="0"
      (itemActivated)="lastFormat.set($any($event))"
      #menu="cngxMenu"
    >
      <li cngxMenuItem value="pdf">PDF</li>
      <li cngxMenuItem value="csv">CSV</li>
      <li cngxMenuItem value="xlsx">Excel workbook</li>
    </ul>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last format</span>
      <span class="event-value">{{ lastFormat() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Open</span>
      <span class="event-value">{{ trigger.isOpen() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
