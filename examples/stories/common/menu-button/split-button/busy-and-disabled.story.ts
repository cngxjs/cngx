import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSplitButton: Busy and disabled',
  subtitle: 'The caret follows the main action; its own <code>disabledReason</code> speaks only for its own <code>disabled</code>.',
  description: 'The caret derives its blocked state from the main <code>cngxButton</code>: while the main button is disabled or running its action, the caret reads <code>aria-disabled</code>, opens on neither click nor key and closes an open menu. In that state the caret carries no reason of its own; the main button owns <code>aria-busy</code>, its reason and the announcement, and a second voice would repeat it. A <code>[disabled]</code> on the caret itself blocks only the alternatives and reads the caret\'s <code>disabledReason</code> through <code>aria-describedby</code>. A format from the menu runs through the main button, so the settle announcement names the format that was exported. Open the menu, then start the slow export to see it close.',
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

  protected readonly copy: Record<string, { done: string; failed: string }> = {
    pdf: { done: 'Exported PDF', failed: 'PDF export failed' },
    csv: { done: 'Exported CSV', failed: 'CSV export failed' },
    xlsx: { done: 'Exported Excel workbook', failed: 'Workbook export failed' },
  };

  private readonly nextFormat = signal('pdf');
  protected readonly running = signal('pdf');

  protected readonly exportReport = (): Promise<void> => {
    this.running.set(this.nextFormat());
    this.nextFormat.set('pdf');
    return new Promise((resolve) => setTimeout(resolve, 3000));
  };

  private readonly main = viewChild.required('main', { read: ElementRef });

  // The other formats run through the main button: one busy state, one voice.
  protected handleFormat(format: string): void {
    this.nextFormat.set(format);
    (this.main().nativeElement as HTMLButtonElement).click();
  }`,
  template: `
  <div cngxSplitButton variant="outline" aria-label="Export report">
    <button
      cngxButton
      [cngxAsyncClick]="exportReport"
      [disabled]="!canExport()"
      disabledReason="Exporting needs the analyst role."
      [succeededAnnouncement]="copy[running()].done"
      [failedAnnouncement]="copy[running()].failed"
      #run="cngxAsyncClick"
      #main
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
    <ul
      cngxMenu
      [label]="'Export formats'"
      tabindex="0"
      (itemActivated)="handleFormat($any($event))"
      #menu="cngxMenu"
    >
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
