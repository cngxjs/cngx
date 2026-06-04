import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Announcement for aria-live',
  subtitle: 'Bind <code>btn.announcement()</code> into an <code>aria-live</code> region so screen-reader users hear "Action succeeded" / "Action failed" without the visual feedback class change reaching them.',
  description: 'The host already mirrors <code>aria-busy</code> while pending, but a class swap between <code>.cngx-async--success</code> and <code>.cngx-async--error</code> is purely visual. <code>announcement()</code> computes the configured succeeded / failed label only while the corresponding settle window is open; bind it into an <code>aria-live="polite"</code> region so the change is also surfaced acoustically. Override the labels per action via <code>[succeededAnnouncement]</code> and <code>[failedAnnouncement]</code> when "Action succeeded" is too generic. The polite region waits for the assistive tech to be idle, so a user keystroking through the page is not interrupted mid-sentence.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'async-state'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { CngxAsyncClick } from \'@cngx/common/interactive\';',
    'import { of, throwError } from \'rxjs\';',
    'import { delay } from \'rxjs/operators\';',
  ],
  imports: ['CngxAsyncClick'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-live`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live' },
    { label: 'WAI-ARIA 1.2: `aria-busy`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-busy' },
    { label: 'WCAG 2.1 SC 4.1.3 Status Messages', href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html' },
  ],
  setup: `
  protected readonly saveAction = () => this.shouldFail()
    ? throwError(() => new Error('save failed')).pipe(delay(700))
    : of(undefined).pipe(delay(700));`,
  setupChrome: `
  protected readonly shouldFail = signal<boolean>(false);`,
  template: `
  <button type="button"
    [cngxAsyncClick]="saveAction"
    succeededAnnouncement="Note saved to server"
    failedAnnouncement="Could not save the note"
    #btn="cngxAsyncClick"
  >
    @switch (btn.status()) {
      @case ('pending') { Saving... }
      @case ('success') { Saved! }
      @case ('error') { Failed }
      @default { Save note }
    }
  </button>

  <div aria-live="polite" aria-atomic="true" class="cngx-sr-only" id="save-announcer">
    {{ btn.announcement() }}
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="shouldFail()" (change)="shouldFail.set($any($event.target).checked)" />
      Server fails
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status()</span>
      <span class="event-value">{{ btn.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">announcement()</span>
      <span class="event-value">{{ btn.announcement() || '—' }}</span>
    </div>
  </div>`,
};
