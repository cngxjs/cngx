import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Announcement for aria-live',
  subtitle: 'Opt out of the built-in polite region with <code>[autoAnnounce]="false"</code> and bind <code>btn.announcement()</code> into your own <code>aria-live</code> region.',
  description: 'By default the directive auto-renders a polite live region next to the host, so success and failure are announced with zero wiring. Opt out with <code>[autoAnnounce]="false"</code> when the announcement belongs somewhere else - a shared page-level announcer, a region with different politeness, or (as here) a region you want to inspect. <code>announcement()</code> computes the configured succeeded / failed label only while the corresponding settle window is open. Override the labels per action via <code>[succeededAnnouncement]</code> and <code>[failedAnnouncement]</code> when "Action succeeded" is too generic. Without the opt-out, a manually wired region would double-announce every settle.',
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
    [autoAnnounce]="false"
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
