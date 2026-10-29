import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIconMenuButton: Kebab',
  subtitle: 'A square <code>cngxIconMenuButton</code> that opens a row menu; the glyph is yours, so is the name.',
  description: 'Outside a split button the icon menu button renders whatever you project, here a vertical ellipsis, hidden from assistive technology. The name is the consumer\'s job: name the menu after what it acts on ("Actions for Q3 report"), not after the glyph; without a name it warns <code>CNGX1071</code> in development. Everything else matches <code>cngxMenuButton</code>: <code>[menu]</code> and <code>[popover]</code> wire it, it reads <code>aria-haspopup="menu"</code> and <code>aria-expanded</code>, toggles on click, opens on ArrowDown, Enter or Space and keeps focus on the button. It is <code>ghost</code> by default, like <code>cngxIconButton</code>.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Button Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
  ],
  apiComponents: ['CngxIconMenuButton', 'CngxIcon', 'CngxMenu', 'CngxMenuItem', 'CngxPopover'],
  moduleImports: [
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CngxIconMenuButton } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
  ],
  imports: ['CngxIcon', 'CngxMenu', 'CngxMenuItem', 'CngxIconMenuButton', 'CngxPopover'],
  setup: `protected readonly lastAction = signal<string | null>(null);`,
  template: `
  <div class="demo-list-row">
    <span>Q3 report</span>
    <button cngxIconMenuButton aria-label="Actions for Q3 report" [menu]="menu" [popover]="pop">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
      </cngx-icon>
    </button>
  </div>
  <div cngxPopover placement="bottom-end" #pop="cngxPopover">
    <ul
      cngxMenu
      [label]="'Actions for Q3 report'"
      tabindex="0"
      (itemActivated)="lastAction.set($any($event))"
      #menu="cngxMenu"
    >
      <li cngxMenuItem value="rename">Rename</li>
      <li cngxMenuItem value="duplicate">Duplicate</li>
      <li cngxMenuItem value="archive">Archive</li>
    </ul>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
  </div>`,
};
