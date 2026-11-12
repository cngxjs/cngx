import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: External state',
  subtitle: 'Bind <code>[externalState]</code> and the button reflects a run it does not own: busy while the state is loading, the result label once it settles.',
  description: 'The button reads its status from a <code>createManualState()</code> that something else drives, here the four chrome buttons standing in for a server push or a second tab. While the state is loading the button carries <code>aria-busy</code> and <code>aria-disabled</code> and refuses clicks, without having been clicked. Each <code>success</code> or <code>error</code> edge the button observes is spoken once in the live region next to it, and the dashed box below logs what that region receives. The <code>[action]</code> only asks for a sync: it flips the shared state to loading and returns, the outcome still arrives from outside.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'behavior'],
  apiComponents: ['CngxActionButton'],
  moduleImports: [
    "import { CngxActionButton } from '@cngx/ui';",
    "import { createManualState } from '@cngx/common/data';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxActionButton'],
  setup: `
  protected readonly sync = createManualState<void>();

  protected readonly requestSync = async (): Promise<void> => {
    this.sync.set('loading');
  };`,
  template: `
  <button
    cngxActionButton
    tone="primary"
    [action]="requestSync"
    [externalState]="sync"
    pendingLabel="Syncing..."
    succeededLabel="Synced"
    failedLabel="Sync failed"
  >Sync now</button>`,
  setupChrome: `
  // Mirrors the accessibility layer of the button into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'sync', selector: 'button[cngxactionbutton]' },
  ]);

  protected handleFail(): void {
    this.sync.setError(new Error('Sync failed'));
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="sync.set('loading')">Start</button>
    <button type="button" (click)="sync.setSuccess(undefined)">Succeed</button>
    <button type="button" (click)="handleFail()">Fail</button>
    <button type="button" (click)="sync.reset()">Reset</button>
  </div>
  <div class="status-row">External state: {{ sync.status() }}</div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} state</dt>
        <dd>aria-disabled {{ row.disabled }}, aria-busy {{ row.busy }}</dd>
      }
      @for (entry of sr.heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM: the busy and disabled state of the button, then the last five texts written to the polite live region next to it, newest last. The state is exposed, not painted; the announcements are spoken as well as shown on the button.
    </p>
  </div>`,
};
