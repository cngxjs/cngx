import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Busy timing',
  subtitle: '<code>[showDelay]</code> and <code>[minDwell]</code> time the busy visual only; the state and the announcement are immediate.',
  description: 'Both buttons run the same 200 ms action. The left one keeps the loading defaults: the spinner and the pending label wait for the show delay and, once shown, hold for the minimum dwell, so a fast run never flashes a spinner and a slow one never blinks it. The right one binds <code>[showDelay]="0"</code> and <code>[minDwell]="0"</code>: the busy visual starts with the click and ends with the run. On both, <code>data-pending</code> and the settle announcement follow the run itself. <code>aria-busy</code> and <code>aria-disabled</code> are set at the click and held until the busy visual releases, so on the left button they outlast the 200 ms run by the rest of the dwell, after the result has been spoken; the button refuses a second click for that whole window. The readout below shows <code>status()</code> (the run) next to <code>busyVisible()</code> (the timed visual) for each button.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'behavior'],
  apiComponents: ['CngxActionButton'],
  moduleImports: [
    "import { CngxActionButton } from '@cngx/ui';",
  ],
  imports: ['CngxActionButton'],
  setup: `
  protected readonly save = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 200));`,
  template: `
  <div class="demo-inline-actions">
    <button
      cngxActionButton
      #timed="cngxActionButton"
      [action]="save"
      pendingLabel="Saving..."
      succeededLabel="Saved"
    >Save (defaults)</button>
    <button
      cngxActionButton
      #instant="cngxActionButton"
      [action]="save"
      [showDelay]="0"
      [minDwell]="0"
      pendingLabel="Saving..."
      succeededLabel="Saved"
    >Save (no delay)</button>
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">defaults: status()</span>
      <span class="event-value">{{ timed.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">defaults: busyVisible()</span>
      <span class="event-value">{{ timed.busyVisible() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">no delay: status()</span>
      <span class="event-value">{{ instant.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">no delay: busyVisible()</span>
      <span class="event-value">{{ instant.busyVisible() }}</span>
    </div>
  </div>`,
};
