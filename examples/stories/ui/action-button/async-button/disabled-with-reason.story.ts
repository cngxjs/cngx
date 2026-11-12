import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Disabled with a reason',
  subtitle: '<code>disabled</code> renders <code>aria-disabled</code> on the action host; it stays focusable, refuses to run and says why.',
  description: 'The action button forwards <code>disabled</code> and <code>disabledReason</code> to the same button brain as <code>CngxButton</code>. A disabled action button renders <code>aria-disabled="true"</code> instead of the native attribute, so it keeps its place in the tab order, a click does not start the action, and <code>disabledReason</code> is read through <code>aria-describedby</code> while (and only while) the button is disabled. Tab to Publish and grant or revoke the editor role to hear the difference. The dashed box below mirrors what a screen reader gets for the button: role, name, description and state are exposed, not painted.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'a11y-pattern'],
  apiComponents: ['CngxActionButton'],
  moduleImports: [
    "import { CngxActionButton } from '@cngx/ui';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxActionButton'],
  setup: `
  protected readonly canPublish = signal(false);

  protected readonly publish = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 600));`,
  template: `
  <button
    cngxActionButton
    tone="primary"
    [action]="publish"
    [disabled]="!canPublish()"
    disabledReason="You need the editor role to publish."
    pendingLabel="Publishing..."
    succeededLabel="Published"
  >Publish</button>`,
  setupChrome: `
  // Mirrors the accessibility layer of the button into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'publish', selector: 'button[cngxactionbutton]' },
  ]);

  protected handleToggle(): void {
    this.canPublish.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleToggle()">{{ canPublish() ? 'Revoke' : 'Grant' }} editor role</button>
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
        <dt>{{ row.label }} state</dt>
        <dd>aria-disabled {{ row.disabled }}, aria-busy {{ row.busy }}</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes; none of it is painted. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
