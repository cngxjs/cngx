import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSplitButton: Basic',
  subtitle: 'A main <code>cngxButton</code> and a <code>cngxIconMenuButton</code> caret in one <code>cngxSplitButton</code> group.',
  description: 'The main button runs the default action through <code>cngxAsyncClick</code>; the caret opens the alternatives. The caret needs no <code>[disabled]</code> and no <code>aria-label</code>: inside a split button it renders the caret glyph, is named "More options" from the language pack, and follows the main button. While the action runs, the main button shows its busy layer and the caret reads <code>aria-disabled</code>, opens on nothing and closes an open menu. A menu choice runs through the main button, so <code>cngxAsyncClick</code> owns the busy state, <code>aria-busy</code> and the announcement for both entry points. Both parts are separate Tab stops; the group carries <code>role="group"</code> and its own name.',
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
  apiComponents: ['CngxSplitButton', 'CngxIconMenuButton', 'CngxButton', 'CngxAsyncClick', 'CngxMenu', 'CngxMenuItem', 'CngxPopover'],
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
  <div cngxSplitButton variant="solid" aria-label="Publish">
    <button cngxButton tone="primary" [cngxAsyncClick]="publish" #run="cngxAsyncClick" #main>Publish</button>
    <button cngxIconMenuButton tone="primary" [menu]="menu" [popover]="pop"></button>
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
