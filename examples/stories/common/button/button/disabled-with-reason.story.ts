import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Disabled with a reason',
  subtitle: '<code>disabled</code> renders <code>aria-disabled</code>; the button stays focusable and says why.',
  description: 'A natively disabled button drops out of the tab order, so a keyboard or screen reader user never learns it exists or why it is off. <code>CngxButton</code> renders <code>[disabled]</code> as <code>aria-disabled="true"</code> instead: the button keeps focus, clicks, <code>routerLink</code> and form submission are swallowed, and <code>disabledReason</code> is read through <code>aria-describedby</code> while (and only while) the button is disabled. Tab to the Publish button and toggle the permission to hear the difference. The dashed box below mirrors what a screen reader gets for the Publish button: role, name, description and state are exposed, not painted.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxButton'],
  moduleImports: [
    "import { CngxButton } from '@cngx/common/button';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxButton'],
  setup: `
  protected readonly canPublish = signal(false);
  protected readonly published = signal(0);

  protected handlePublish(): void {
    this.published.update((n) => n + 1);
  }`,
  template: `
  <button
    cngxButton
    tone="primary"
    [disabled]="!canPublish()"
    disabledReason="You need the editor role to publish."
    (click)="handlePublish()"
  >Publish</button>`,
  setupChrome: `
  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'publish', selector: 'button[cngxbutton]' },
  ]);

  protected handleToggle(): void {
    this.canPublish.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleToggle()">{{ canPublish() ? 'Revoke' : 'Grant' }} editor role</button>
  </div>
  <div class="status-row">Published {{ published() }} time(s)</div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}{{ row.popup ? ', ' + row.popup : '' }}</dd>
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
