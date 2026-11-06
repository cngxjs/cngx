import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuButton: Disabled with a reason',
  subtitle: '<code>disabled</code> keeps the menu button focusable, opens nothing and says why.',
  description: 'A disabled menu button renders <code>aria-disabled="true"</code> instead of the native attribute, so it stays in the tab order and reads its <code>disabledReason</code> through <code>aria-describedby</code>. Neither a click nor ArrowDown, ArrowUp, Enter or Space opens the menu while it is disabled, and a menu that is open when the button becomes disabled closes. Open the menu, then revoke the export permission to see it close. The dashed box below mirrors what a screen reader gets for the menu button: role, name, description and state are exposed, not painted.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxMenuButton'],
  moduleImports: [
    "import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CngxMenuButton } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
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
  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'menu button', selector: 'button[cngxmenubutton]' },
  ]);

  protected handleToggle(): void {
    this.canExport.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleToggle()">{{ canExport() ? 'Revoke' : 'Grant' }} analyst role</button>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}{{ row.popup ? ', ' + row.popup : '' }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
        <dt>{{ row.label }} description</dt>
        <dd>{{ row.description }}</dd>
        <dt>{{ row.label }} state</dt>
        <dd>aria-disabled {{ row.disabled }}, aria-busy {{ row.busy }}</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes; none of it is painted. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
