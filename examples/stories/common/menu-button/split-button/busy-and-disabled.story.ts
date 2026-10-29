import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSplitButton: Busy and disabled',
  subtitle: 'The caret follows the main action; its own <code>disabledReason</code> speaks only for its own <code>disabled</code>.',
  description: 'The caret derives its blocked state from the main <code>cngxButton</code>: while the main button is disabled or running its action, the caret reads <code>aria-disabled</code>, opens on neither click nor key and closes an open menu. In that state the caret carries no reason of its own; the main button owns <code>aria-busy</code>, its reason and the announcement, and a second voice would repeat it. A <code>[disabled]</code> on the caret itself blocks only the alternatives and reads the caret\'s <code>disabledReason</code> through <code>aria-describedby</code>. Open the menu, then start the slow export to see it close.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'a11y-pattern', 'behavior'],
  apiComponents: ['CngxSplitButton', 'CngxIconMenuButton', 'CngxButton', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxButton } from '@cngx/common/button';",
    "import { CngxAsyncClick, CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CngxIconMenuButton, CngxSplitButton } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxButton',
    'CngxAsyncClick',
    'CngxMenu',
    'CngxMenuItem',
    'CngxIconMenuButton',
    'CngxSplitButton',
    'CngxPopover',
  ],
  setup: `
  protected readonly canExport = signal(true);
  protected readonly formatsLocked = signal(false);

  protected readonly exportReport = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 3000));`,
  template: `
  <div cngxSplitButton variant="outline" aria-label="Export report">
    <button
      cngxButton
      [cngxAsyncClick]="exportReport"
      [disabled]="!canExport()"
      disabledReason="Exporting needs the analyst role."
      #run="cngxAsyncClick"
    >
      Export PDF
    </button>
    <button
      cngxIconMenuButton
      [menu]="menu"
      [popover]="pop"
      [disabled]="formatsLocked()"
      disabledReason="Other formats are part of the Pro plan."
    ></button>
  </div>
  <div cngxPopover placement="bottom-end" #pop="cngxPopover">
    <ul cngxMenu [label]="'Export formats'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="csv">CSV</li>
      <li cngxMenuItem value="xlsx">Excel workbook</li>
    </ul>
  </div>`,
  setupChrome: `
  protected handleToggleRole(): void {
    this.canExport.update((v) => !v);
  }

  protected handleToggleFormats(): void {
    this.formatsLocked.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleToggleRole()">{{ canExport() ? 'Revoke' : 'Grant' }} analyst role</button>
    <button type="button" (click)="handleToggleFormats()">{{ formatsLocked() ? 'Unlock' : 'Lock' }} other formats</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Exporting</span>
      <span class="event-value">{{ run.pending() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
