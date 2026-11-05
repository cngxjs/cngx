import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Basic happy path',
  subtitle: 'Apply <code>[cngxAsyncClick]="action"</code> to any clickable element. The directive tracks the action lifecycle, auto-disables the host while pending, and resets after <code>feedbackDuration</code>.',
  description: 'Wraps a click handler in an async-state machine. The action factory you bind to <code>[cngxAsyncClick]</code> can return a Promise or an Observable; the directive runs it on click, flips its <code>pending()</code> signal while in flight, then settles to <code>succeeded()</code> or <code>failed()</code> for <code>feedbackDuration</code> ms (default 2000) before returning to idle. The host class <code>.cngx-async--pending</code> / <code>--success</code> / <code>--error</code> mirrors the lifecycle; <code>--pending</code> follows the show delay of the loading config (a run faster than 120 ms never gets it) and is held for the min-dwell once shown. <code>pending()</code> and the settle announcement are immediate; <code>aria-busy</code> and <code>aria-disabled</code> are set at the click and held until the busy visual releases, so the host refuses a double-click for the whole dwell, through <code>aria-disabled</code> and a click guard, never the native <code>disabled</code> attribute, so it keeps focus. Pick fast / medium / slow to see the pending phase with no visual, the visual held through its dwell, and a long run; the readout shows <code>busyVisible()</code> next to <code>pending()</code>. Template branches via <code>@switch (btn.status())</code>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'async-state'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { signal } from \'@angular/core\';',
    'import { CngxAsyncClick } from \'@cngx/common/interactive\';',
    'import { of } from \'rxjs\';',
    'import { delay } from \'rxjs/operators\';',
  ],
  imports: ['CngxAsyncClick'],
  setup: `
  protected readonly saveAction = () => of(undefined).pipe(delay(this.latencyMs()));`,
  setupChrome: `
  protected readonly latency = signal<'fast' | 'medium' | 'slow'>('medium');

  protected latencyMs(): number {
    switch (this.latency()) {
      case 'fast':
        return 80;
      case 'medium':
        return 200;
      default:
        return 1500;
    }
  }`,
  template: `
  <button type="button" [cngxAsyncClick]="saveAction" #btn="cngxAsyncClick">
    @switch (btn.status()) {
      @case ('pending') { Saving... }
      @case ('success') { Saved! }
      @case ('error') { Failed }
      @default { Save }
    }
  </button>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <div role="radiogroup" aria-label="Run latency" style="display:inline-flex;gap:12px">
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-async-click-latency"
               [checked]="latency() === 'fast'"
               (change)="latency.set('fast')" />
        fast (80 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-async-click-latency"
               [checked]="latency() === 'medium'"
               (change)="latency.set('medium')" />
        medium (200 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-async-click-latency"
               [checked]="latency() === 'slow'"
               (change)="latency.set('slow')" />
        slow (1.5 s)
      </label>
    </div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status()</span>
      <span class="event-value">{{ btn.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">pending()</span>
      <span class="event-value">{{ btn.pending() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">busyVisible()</span>
      <span class="event-value">{{ btn.busyVisible() }}</span>
    </div>
  </div>`,

};
