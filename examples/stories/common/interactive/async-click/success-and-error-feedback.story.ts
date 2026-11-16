import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Success and error feedback',
  subtitle: 'Toggle the fail flag to flip the action between success and error settle paths. Watch the host class swap from <code>.cngx-async--success</code> to <code>--error</code> for <code>feedbackDuration</code> ms.',
  description: 'Both settle paths share the same auto-reset timer. On success the directive sets <code>succeeded()</code> true and schedules a <code>feedbackDuration</code>-ms timeout that clears it back to idle. On failure it sets <code>failed()</code> true and stashes the rejection reason on <code>error()</code>, then runs the same timer. A click while the directive is still in either settle state cancels the pending reset and immediately starts a new pending cycle. <code>feedbackDuration</code> binds the visible state-feedback window; consumers needing persistent error display read <code>btn.error()</code> separately. Each settle is also spoken through the polite live region the directive renders next to the host.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'async-state', 'error-handling'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { CngxAsyncClick } from \'@cngx/common/interactive\';',
    'import { delay, of } from \'rxjs\';',
    'import { failDemoActionWhen } from \'../../../../fixtures\';',
  ],
  imports: ['CngxAsyncClick'],
  setup: `
  protected readonly submitAction = () => of(undefined).pipe(delay(700));`,
  setupChrome: `
  protected readonly shouldFail = signal<boolean>(false);
  // Makes submitAction fail while the switch below is on.
  private readonly failSwitch = failDemoActionWhen(
    this,
    'submitAction',
    () => this.shouldFail(),
    () => new Error('Server rejected the request'),
  );

  protected formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err === undefined || err === null) return '-';
    return String(err);
  }

  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly heard = signal<readonly { n: number; text: string }[]>([]);
  protected readonly ariaBusy = signal('-');

  // Logs the real DOM writes into the live region next to each async button.
  private readonly srMirror = afterNextRender(() => {
    const host = this.hostEl.nativeElement;
    const lastText = new WeakMap<Element, string>();
    let count = 0;
    const readBusy = (): void => {
      const buttons = Array.from(host.querySelectorAll('button')).filter(
        (b) => b.nextElementSibling?.hasAttribute('aria-live') ?? false,
      );
      this.ariaBusy.set(
        buttons.map((b) => (b.getAttribute('aria-busy') ?? '-')).join(', ') || '-',
      );
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const el = record.target instanceof Element ? record.target : record.target.parentElement;
        const region = el?.closest('[aria-live]');
        if (!region || !host.contains(region) || region.previousElementSibling?.tagName !== 'BUTTON') {
          continue;
        }
        const text = region.textContent?.trim() ?? '';
        if (text === lastText.get(region)) {
          continue;
        }
        lastText.set(region, text);
        if (text !== '') {
          count += 1;
          const entry = { n: count, text: '"' + text + '"' };
          this.heard.update((list) => [...list, entry].slice(-5));
        }
      }
      readBusy();
    });
    observer.observe(host, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-busy'],
    });
    readBusy();
    this.destroyRef.onDestroy(() => observer.disconnect());
  });`,
  template: `
  <button type="button" [cngxAsyncClick]="submitAction" #btn="cngxAsyncClick">
    @switch (btn.status()) {
      @case ('pending') { Submitting... }
      @case ('success') { Submitted! }
      @case ('error') { Failed }
      @default { Submit }
    }
  </button>`,
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
      <span class="event-label">error()</span>
      <span class="event-value">{{ formatError(btn.error()) }}</span>
    </div>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      <dt>aria-busy</dt>
      <dd>{{ ariaBusy() }}</dd>
      @for (entry of heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      The last five texts written to the polite live region next to the button, newest last. They are spoken as well as painted on the button; two writes in one frame may be voiced once, depending on the screen reader.
    </p>
  </div>`,
};
