import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Basic happy path',
  subtitle: 'Apply <code>[cngxAsyncClick]="action"</code> to any clickable element. The directive tracks the action lifecycle, auto-disables the host while pending, and resets after <code>feedbackDuration</code>.',
  description: 'Wraps a click handler in an async-state machine. The action factory you bind to <code>[cngxAsyncClick]</code> can return a Promise or an Observable; the directive runs it on click, flips its <code>pending()</code> signal while in flight, then settles to <code>succeeded()</code> or <code>failed()</code> for <code>feedbackDuration</code> ms (default 2000) before returning to idle. The host class <code>.cngx-async--pending</code> / <code>--success</code> / <code>--error</code> mirrors the lifecycle, and ARIA <code>aria-busy</code> / <code>aria-disabled</code> + the native <code>disabled</code> attribute (on form controls) prevent double-clicks. Template branches via <code>@switch (btn.status())</code>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'async-state'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { CngxAsyncClick } from \'@cngx/common/interactive\';',
    'import { of } from \'rxjs\';',
    'import { delay } from \'rxjs/operators\';',
  ],
  imports: ['CngxAsyncClick'],
  setup: `
  protected readonly saveAction = () => of(undefined).pipe(delay(800));`,
  template: `
  <button [cngxAsyncClick]="saveAction" #btn="cngxAsyncClick">
    @switch (btn.status()) {
      @case ('pending') { Saving... }
      @case ('success') { Saved! }
      @case ('error') { Failed }
      @default { Save }
    }
  </button>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status()</span>
      <span class="event-value">{{ btn.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">pending()</span>
      <span class="event-value">{{ btn.pending() }}</span>
    </div>
  </div>`,
};
