import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Busy with cngxAsyncClick',
  subtitle: 'Co-host <code>cngxAsyncClick</code>: the label stays in place under a spinner while the action runs.',
  description: 'The button does not own async state; <code>cngxAsyncClick</code> on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. <code>aria-busy</code>, the double-click guard and the success or failure announcement all stay with <code>cngxAsyncClick</code>. Under reduced motion the ring stops turning. The label stays fixed on purpose: swapping it per status would change the accessible name under focus and the width after the run. Per-status labels belong to <code>CngxActionButton</code>. So the result of a run is not painted on the button at all: success and failure are spoken through the polite live region <code>cngxAsyncClick</code> renders next to the host. The spinner follows the loading config: a run faster than the show delay (120 ms by default) never shows the ring, and a ring that did appear stays for at least the min-dwell (400 ms) so it never flickers. <code>aria-busy</code>, the click guard and the spoken result never wait for it. Pick the fast run to see a save with no ring at all, the slow run to see the ring hold. Toggle the failure switch to run the error path; the button looks the same either way, and the dashed box below mirrors what a screen reader gets.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxButton', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxButton } from '@cngx/common/button';",
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxButton', 'CngxAsyncClick'],
  setup: `
  protected readonly fail = signal(false);
  protected readonly latency = signal<'fast' | 'slow'>('slow');

  protected readonly save = (): Promise<void> =>
    new Promise((resolve, reject) =>
      setTimeout(
        () => (this.fail() ? reject(new Error('Save failed')) : resolve()),
        this.latency() === 'fast' ? 80 : 1500,
      ),
    );`,
  template: `
  <button cngxButton tone="primary" [cngxAsyncClick]="save" #btn="cngxAsyncClick">Save changes</button>`,
  setupChrome: `
  // Mirrors the accessibility layer of the button into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'save', selector: 'button[cngxbutton]' },
  ]);`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <div role="radiogroup" aria-label="Save latency" style="display:inline-flex;gap:12px">
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-button-busy-latency"
               [checked]="latency() === 'fast'"
               (change)="latency.set('fast')" />
        fast run (80 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-button-busy-latency"
               [checked]="latency() === 'slow'"
               (change)="latency.set('slow')" />
        slow run (1.5 s)
      </label>
    </div>
    <label><input type="checkbox" [checked]="fail()" (change)="fail.set(!fail())" /> Fail the next save</label>
  </div>
  <div class="status-row" style="margin-top:8px">
    <span>busy layer: {{ btn.busyVisible() ? 'showing' : '-' }}</span>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
        <dt>{{ row.label }} description</dt>
        <dd>{{ row.description }}</dd>
        <dt>{{ row.label }} aria-disabled</dt>
        <dd>{{ row.disabled }}</dd>
      }
      <dt>aria-busy</dt>
      <dd>{{ btn.pending() ? 'true' : '-' }}</dd>
      <dt>announced</dt>
      <dd>{{ btn.announcement() ? '"' + btn.announcement() + '"' : '-' }}</dd>
    </dl>
    <p class="cngx-ex-sr-output__note">
      Not shown on the button: the label stays fixed, the result is spoken only, for 2 s after the run settles. The name approximates accname (aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts); the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
