import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Custom spinner',
  subtitle: 'Swap the busy glyph of every button in a subtree with <code>provideButtonSpinner</code>.',
  description: 'The busy layer stays the same for every cngx button: it covers the label so the width never jumps, it is <code>aria-hidden</code>, and it follows the show delay and min-dwell of the run. Only the glyph inside it is replaceable. Provide a component with <code>provideButtonSpinner</code> (here in <code>viewProviders</code>, so only this demo is affected) and <code>cngxButton</code>, <code>cngxIconButton</code>, <code>cngxCloseButton</code>, the menu buttons and <code>cngxActionButton</code> render it in place of the ring. Without a provider the built-in ring renders. Pick the fast run (80 ms) and press Save changes: the run ends inside the show delay (120 ms by default), so the dots never appear and <code>data-busy</code> never flips. Pick the slow run (1.5 s): the dots appear after the show delay and stay at least the min-dwell (400 ms). The readout below the buttons tracks the Save button: the run state, whether its busy layer shows, the live <code>data-busy</code> attribute and the timeline of the last run. <code>aria-busy</code> comes from <code>cngxAsyncClick</code> and is set for the whole run, whether the dots show or not; the dashed box mirrors it. The fixture sits next to this story as <code>_dots-spinner.component.ts</code>.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxButton', 'CngxIconButton', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxButton, CngxIconButton, provideButtonSpinner } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
    "import { DotsSpinner } from './_dots-spinner.component';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxButton', 'CngxIconButton', 'CngxIcon', 'CngxAsyncClick'],
  viewProviders: ['provideButtonSpinner(DotsSpinner)'],
  setup: `
  protected readonly latency = signal<'fast' | 'slow'>('slow');

  protected readonly save = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, this.latency() === 'fast' ? 80 : 1500));`,
  template: `
  <div class="demo-inline-actions">
    <button cngxButton tone="primary" [cngxAsyncClick]="save" #run="cngxAsyncClick">Save changes</button>
    <button cngxIconButton aria-label="Sync" [cngxAsyncClick]="save">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>
      </cngx-icon>
    </button>
  </div>`,
  setupChrome: `
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  // Mirrors the accessibility layer of the Save button into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'save', selector: 'button[cngxbutton]' },
  ]);

  // Live data-busy of the Save button and the timeline of its last run, read
  // from the DOM attributes, not from the directive state.
  protected readonly dataBusy = signal('-');
  protected readonly timeline = signal('no run yet');
  private last = { pending: false, busy: false };
  private startedAt = 0;
  private shownAt: number | undefined;
  private goneAt: number | undefined;
  private endedAt: number | undefined;

  private sample(): void {
    const btn = this.hostEl.nativeElement.querySelector('button[cngxbutton]');
    if (!btn) {
      return;
    }
    const pending = btn.getAttribute('data-pending') === 'true';
    const busy = btn.getAttribute('data-busy') === 'true';
    this.dataBusy.set(busy ? 'true' : '-');
    if (pending && !this.last.pending) {
      this.startedAt = performance.now();
      this.shownAt = undefined;
      this.goneAt = undefined;
      this.endedAt = undefined;
    }
    const at = Math.round(performance.now() - this.startedAt);
    if (busy && !this.last.busy) {
      this.shownAt = at;
    }
    if (!busy && this.last.busy) {
      this.goneAt = at;
    }
    if (!pending && this.last.pending) {
      this.endedAt = at;
    }
    this.last = { pending, busy };
    this.timeline.set(this.describe());
  }

  private describe(): string {
    const run = this.endedAt === undefined ? 'run pending' : 'run ended at +' + this.endedAt + 'ms';
    if (this.shownAt === undefined) {
      return run + ', busy layer ' + (this.endedAt === undefined ? 'not shown yet (show delay)' : 'never shown');
    }
    const gone =
      this.goneAt === undefined
        ? ''
        : ', gone at +' + this.goneAt + 'ms (' + (this.goneAt - this.shownAt) + 'ms on screen)';
    return run + ', busy layer shown at +' + this.shownAt + 'ms' + gone;
  }

  private readonly watch = afterNextRender(() => {
    const observer = new MutationObserver(() => this.sample());
    observer.observe(this.hostEl.nativeElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-busy', 'data-pending'],
    });
    this.destroyRef.onDestroy(() => observer.disconnect());
  });`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <div role="radiogroup" aria-label="Save latency" style="display:inline-flex;gap:12px">
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-button-spinner-latency"
               [checked]="latency() === 'fast'"
               (change)="latency.set('fast')" />
        fast run (80 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-button-spinner-latency"
               [checked]="latency() === 'slow'"
               (change)="latency.set('slow')" />
        slow run (1.5 s)
      </label>
    </div>
  </div>
  <div class="event-grid">
    <div class="event-row"><span class="event-label">Save: run</span><span class="event-value">{{ run.pending() ? 'pending' : 'idle' }}</span></div>
    <div class="event-row"><span class="event-label">Save: busy layer</span><span class="event-value">{{ run.busyVisible() ? 'showing' : '-' }}</span></div>
    <div class="event-row"><span class="event-label">Save: data-busy</span><span class="event-value">{{ dataBusy() }}</span></div>
    <div class="event-row"><span class="event-label">Save: last run</span><span class="event-value">{{ timeline() }}</span></div>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
        <dt>{{ row.label }} aria-busy</dt>
        <dd>{{ row.busy }}</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes; the dots are aria-hidden and never part of the name. aria-busy is set for the whole run, also when the run ends before the dots show. The name approximates accname (aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts); the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
