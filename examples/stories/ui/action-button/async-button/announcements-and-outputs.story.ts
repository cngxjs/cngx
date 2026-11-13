import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Announcements and outputs',
  subtitle: '<code>succeededAnnouncement</code> / <code>failedAnnouncement</code> set what the live region speaks, <code>(settled)</code> and <code>(outcome)</code> report every result.',
  description: 'The status cells and the announcement are separate: <code>succeededLabel</code> is what the button shows, <code>succeededAnnouncement</code> what the polite region next to it speaks, so the visible label can stay short while the announcement names the result in full. <code>[feedbackDuration]</code> keeps the result cell (and the region text) up for 4 s instead of the 2 s default. <code>(settled)</code> comes from the run and carries a monotonic <code>generation</code>; <code>(outcome)</code> comes from the status brain and also fires for an <code>[externalState]</code> edge. The second button binds <code>[autoAnnounce]="false"</code>: its region stays in the DOM but receives no text, for a page that announces the result itself.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'behavior'],
  apiComponents: ['CngxActionButton'],
  moduleImports: [
    "import { CngxActionButton } from '@cngx/ui';",
    "import type { CngxActionOutcome, CngxAsyncSettle } from '@cngx/common/interactive';",
    "import { failDemoActionWhen, mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxActionButton'],
  setup: `
  protected readonly events = signal<readonly string[]>([]);

  protected readonly exportReport = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 400));

  protected handleSettled(name: string, settle: CngxAsyncSettle): void {
    this.log(name + ' (settled) #' + settle.generation + ' ' + settle.status);
  }

  protected handleOutcome(name: string, outcome: CngxActionOutcome): void {
    this.log(name + ' (outcome) ' + outcome.status);
  }

  private log(line: string): void {
    this.events.update((list) => [...list, line].slice(-6));
  }`,
  template: `
  <div class="demo-inline-actions">
    <button
      cngxActionButton
      tone="primary"
      [action]="exportReport"
      succeededLabel="Exported"
      failedLabel="Failed"
      succeededAnnouncement="Quarterly report exported."
      failedAnnouncement="Export failed. The report was not created."
      [feedbackDuration]="4000"
      (settled)="handleSettled('export', $event)"
      (outcome)="handleOutcome('export', $event)"
    >Export report</button>
    <button
      cngxActionButton
      [action]="exportReport"
      [autoAnnounce]="false"
      (outcome)="handleOutcome('quiet', $event)"
    >Export quietly</button>
  </div>`,
  setupChrome: `
  protected readonly failNext = signal(false);
  // Makes exportReport fail while the switch below is on.
  private readonly failSwitch = failDemoActionWhen(
    this,
    'exportReport',
    () => this.failNext(),
    () => new Error('The export service timed out.'),
  );

  // Logs the live regions next to the buttons into the box below.
  protected readonly sr = mirrorScreenReader([]);`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label style="display:inline-flex;gap:4px;align-items:center">
      <input type="checkbox" [checked]="failNext()" (change)="failNext.set(!failNext())" />
      Fail the next run
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    @for (line of events(); track $index) {
      <div class="event-row">
        <span class="event-label">event</span>
        <span class="event-value">{{ line }}</span>
      </div>
    } @empty {
      <div class="event-row">
        <span class="event-label">event</span>
        <span class="event-value">-</span>
      </div>
    }
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Button regions receive</p>
    <dl class="cngx-ex-sr-output__list">
      @for (entry of sr.heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      The texts written to the polite live regions next to the buttons. Export report speaks its announcement, not its label; Export quietly writes nothing.
    </p>
  </div>`,
};
