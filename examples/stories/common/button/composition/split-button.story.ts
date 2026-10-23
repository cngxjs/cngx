import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Composition: Split button',
  subtitle: 'A <code>cngxButtonGroup</code> of the main action and a caret <code>cngxIconButton</code> that opens the alternatives.',
  description: 'A split button is a group of two buttons, not a new class. The main button runs the default action through <code>cngxAsyncClick</code>; the caret is an icon button with its own <code>aria-label</code> that opens a menu through <code>cngxMenuTrigger</code> and <code>cngxPopoverTrigger</code>. Both parts are separate Tab stops. The busy state is shared: a menu choice runs through the same action, and while it is pending the main button shows its busy layer and both parts refuse activation. Solid primary segments get a seam line so the two parts stay readable.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'async-state', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Button Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
  ],
  apiComponents: ['CngxButtonGroup', 'CngxButton', 'CngxIconButton', 'CngxAsyncClick', 'CngxMenuTrigger', 'CngxMenu', 'CngxMenuItem', 'CngxPopoverTrigger'],
  moduleImports: [
    "import { CngxButton, CngxButtonGroup, CngxIconButton } from '@cngx/common/button';",
    "import { CngxAsyncClick, CngxMenu, CngxMenuItem, CngxMenuTrigger } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxButton',
    'CngxButtonGroup',
    'CngxIconButton',
    'CngxAsyncClick',
    'CngxMenu',
    'CngxMenuItem',
    'CngxMenuTrigger',
    'CngxPopover',
    'CngxPopoverTrigger',
  ],
  setup: `
  protected readonly mode = signal('now');
  protected readonly lastRun = signal<string | null>(null);

  protected readonly publish = (): Promise<void> =>
    new Promise((resolve) =>
      setTimeout(() => {
        this.lastRun.set(this.mode());
        this.mode.set('now');
        resolve();
      }, 1500),
    );

  private readonly main = viewChild.required('main', { read: ElementRef });

  // A menu choice runs through the main button, so cngxAsyncClick owns the
  // busy state, aria-busy and the announcement for both entry points.
  protected handleChoice(choice: string): void {
    this.mode.set(choice);
    (this.main().nativeElement as HTMLButtonElement).click();
  }`,
  template: `
  <div cngxButtonGroup variant="solid" aria-label="Publish">
    <button cngxButton tone="primary" [cngxAsyncClick]="publish" #run="cngxAsyncClick" #main>Publish</button>
    <button
      cngxIconButton
      tone="primary"
      aria-label="More publish options"
      [disabled]="run.pending()"
      [cngxMenuTrigger]="menu"
      [cngxPopoverTrigger]="pop"
      [haspopup]="'menu'"
      [popover]="pop"
      (click)="pop.toggle()"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </button>
  </div>
  <div cngxPopover placement="bottom-end" #pop="cngxPopover">
    <ul
      cngxMenu
      [label]="'Publish options'"
      tabindex="0"
      (itemActivated)="handleChoice($any($event))"
      #menu="cngxMenu"
    >
      <li cngxMenuItem value="draft">Save as draft</li>
      <li cngxMenuItem value="scheduled">Schedule for tomorrow</li>
      <li cngxMenuItem value="team">Publish to team only</li>
    </ul>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Busy</span>
      <span class="event-value">{{ run.pending() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last run</span>
      <span class="event-value">{{ lastRun() ?? '-' }}</span>
    </div>
  </div>`,
};
