import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuButton: Disabled with a reason',
  subtitle: '<code>disabled</code> keeps the menu button focusable, opens nothing and says why.',
  description: 'A disabled menu button renders <code>aria-disabled="true"</code> instead of the native attribute, so it stays in the tab order and reads its <code>disabledReason</code> through <code>aria-describedby</code>. Neither a click nor ArrowDown, ArrowUp, Enter or Space opens the menu while it is disabled, and a menu that is open when the button becomes disabled closes. Open the menu, then revoke the export permission to see it close.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxMenuButton'],
  moduleImports: [
    "import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CngxMenuButton } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
  ],
  imports: ['CngxMenu', 'CngxMenuItem', 'CngxMenuButton', 'CngxPopover'],
  setup: `protected readonly canExport = signal(true);`,
  template: `
  <button
    cngxMenuButton="outline"
    [menu]="menu"
    [popover]="pop"
    [disabled]="!canExport()"
    disabledReason="Exporting needs the analyst role."
  >
    Export
  </button>
  <div cngxPopover placement="bottom-start" #pop="cngxPopover">
    <ul cngxMenu [label]="'Export format'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="pdf">PDF</li>
      <li cngxMenuItem value="csv">CSV</li>
    </ul>
  </div>`,
  setupChrome: `
  protected handleToggle(): void {
    this.canExport.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleToggle()">{{ canExport() ? 'Revoke' : 'Grant' }} analyst role</button>
  </div>`,
};
