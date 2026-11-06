import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSplitButton: Basic',
  subtitle: 'A main <code>cngxButton</code> and a <code>cngxIconMenuButton</code> caret in one <code>cngxSplitButton</code> group.',
  description: 'The main button runs the default action through <code>cngxAsyncClick</code>; the caret opens the alternatives. The caret needs no <code>[disabled]</code> and no <code>aria-label</code>: inside a split button it renders the caret glyph, is named "More options" from the language pack, and follows the main button. While the action runs, the main button shows its busy layer and the caret reads <code>aria-disabled</code>, opens on nothing and closes an open menu. A menu choice runs immediately, through the main button, so <code>cngxAsyncClick</code> owns the busy state, <code>aria-busy</code> and the announcement for both entry points. The settle announcement names the action that ran ("Saved as draft", not a generic "Action succeeded"). Both parts are separate Tab stops; the group carries <code>role="group"</code> and its own name. The dashed box below mirrors what a screen reader gets for the main button and the caret: role, name, description, state and the announcements are exposed or spoken, not painted.',
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
    "import { mirrorScreenReader } from '../../../../fixtures';",
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
  // Copy per action: the settle announcement names the action that ran,
  // whichever entry point started it.
  protected readonly copy: Record<string, { done: string; failed: string }> = {
    now: { done: 'Published', failed: 'Publishing failed' },
    draft: { done: 'Saved as draft', failed: 'Saving the draft failed' },
    scheduled: { done: 'Scheduled for tomorrow', failed: 'Scheduling failed' },
    team: { done: 'Published to team', failed: 'Publishing to team failed' },
  };

  private readonly nextMode = signal('now');
  protected readonly running = signal('now');
  protected readonly lastRun = signal<string | null>(null);

  protected readonly publish = (): Promise<void> => {
    this.running.set(this.nextMode());
    this.nextMode.set('now');
    return new Promise((resolve) =>
      setTimeout(() => {
        this.lastRun.set(this.running());
        resolve();
      }, 1500),
    );
  };

  private readonly main = viewChild.required('main', { read: ElementRef });

  // A menu choice runs through the main button, so cngxAsyncClick owns the
  // busy state, aria-busy and the announcement for both entry points.
  protected handleChoice(choice: string): void {
    this.nextMode.set(choice);
    (this.main().nativeElement as HTMLButtonElement).click();
  }`,
  template: `
  <div cngxSplitButton variant="solid" aria-label="Publish">
    <button
      cngxButton
      tone="primary"
      [cngxAsyncClick]="publish"
      [succeededAnnouncement]="copy[running()].done"
      [failedAnnouncement]="copy[running()].failed"
      #run="cngxAsyncClick"
      #main
    >
      Publish
    </button>
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
  setupChrome: `
  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'main', selector: '[cngxsplitbutton] > button:first-of-type' },
    { label: 'caret', selector: '[cngxsplitbutton] > button:last-of-type' },
  ]);`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Busy</span>
      <span class="event-value">{{ run.pending() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last run</span>
      <span class="event-value">{{ lastRun() ?? '-' }}</span>
    </div>
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
      @for (entry of sr.heard(); track entry.n) {
        <dt>announced #{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes, plus the last five texts written to a live region, newest last; none of it is painted. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
