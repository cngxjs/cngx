import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Announcement for aria-live',
  subtitle: 'Opt out of the built-in polite region with <code>[autoAnnounce]="false"</code> and drive your own <code>aria-live</code> region from <code>(settled)</code>.',
  description: 'By default the directive auto-renders a polite live region next to the host, so success and failure are announced with zero wiring. Opt out with <code>[autoAnnounce]="false"</code> when the announcement belongs somewhere else: a shared page-level announcer, a region with different politeness, or (as here) a region you want to inspect. Write that region from <code>(settled)</code>, once per run: clear it, then put the copy for <code>settle.status</code> in after the next render, the way the built-in region does. Do not bind the <code>announcement()</code> signal into it. That signal is state, so two runs that settle before change detection coalesce into one value and the first one is never spoken. Without the opt-out, the built-in region and yours would both speak every settle. The result reaches the screen reader only; the dashed box below mirrors what the region holds.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'async-state'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { Injector } from \'@angular/core\';',
    'import { CngxAsyncClick, type CngxAsyncSettle } from \'@cngx/common/interactive\';',
    'import { of, throwError } from \'rxjs\';',
    'import { delay } from \'rxjs/operators\';',
  ],
  imports: ['CngxAsyncClick'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-live`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live' },
    { label: 'WCAG 2.1 SC 4.1.3 Status Messages', href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html' },
  ],
  setup: `
  private readonly injector = inject(Injector);
  protected readonly spoken = signal('');

  protected readonly saveAction = () => this.shouldFail()
    ? throwError(() => new Error('save failed')).pipe(delay(700))
    : of(undefined).pipe(delay(700));

  protected handleSettled(settle: CngxAsyncSettle): void {
    const text = settle.status === 'success' ? 'Note saved to server' : 'Could not save the note';
    this.spoken.set('');
    afterNextRender({ write: () => this.spoken.set(text) }, { injector: this.injector });
  }`,
  setupChrome: `
  protected readonly shouldFail = signal<boolean>(false);`,
  template: `
  <button type="button"
    [cngxAsyncClick]="saveAction"
    [autoAnnounce]="false"
    (settled)="handleSettled($event)"
    #btn="cngxAsyncClick"
  >
    @switch (btn.status()) {
      @case ('pending') { Saving... }
      @case ('success') { Saved! }
      @case ('error') { Failed }
      @default { Save note }
    }
  </button>

  <div aria-live="polite" aria-atomic="true" class="cngx-sr-only" id="save-announcer">{{ spoken() }}</div>`,
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
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      <dt>#save-announcer</dt>
      <dd>{{ spoken() ? '"' + spoken() + '"' : '-' }}</dd>
    </dl>
    <p class="cngx-ex-sr-output__note">
      The region is visually hidden: it holds the text of the last settle until the next run clears it.
    </p>
  </div>`,
};
