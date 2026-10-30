import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuButton: Basic',
  subtitle: 'A button that opens a menu: <code>cngxMenuButton</code> plus <code>[menu]</code> and <code>[popover]</code>.',
  description: 'The menu button is its own button type on the button core, so variant, tone, size and the disabled state behave as on <code>cngxButton</code>. Two bindings wire it: <code>[menu]</code> is the <code>cngxMenu</code> it drives, <code>[popover]</code> the <code>cngxPopover</code> around it. The button anchors the panel, reads <code>aria-haspopup="menu"</code> and <code>aria-expanded</code>, and toggles on click. ArrowDown, Enter or Space opens the menu and highlights the first item, ArrowUp the last; the button keeps focus and drives <code>aria-activedescendant</code>. Escape closes the menu and focus stays on the button. The caret is decorative and turns while the menu is open.',
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
  apiComponents: ['CngxMenuButton', 'CngxMenu', 'CngxMenuItem', 'CngxPopover'],
  moduleImports: [
    "import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CngxMenuButton } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
  ],
  imports: ['CngxMenu', 'CngxMenuItem', 'CngxMenuButton', 'CngxPopover'],
  setup: `protected readonly lastFormat = signal<string | null>(null);`,
  template: `
  <button cngxMenuButton="outline" [menu]="menu" [popover]="pop" #exportButton="cngxMenuButton">
    Export
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
      <span class="event-value">{{ exportButton.expanded() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
