import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Disabled with a reason',
  subtitle: '<code>disabled</code> renders <code>aria-disabled</code>; the button stays focusable and says why.',
  description: 'A natively disabled button drops out of the tab order, so a keyboard or screen reader user never learns it exists or why it is off. <code>CngxButton</code> renders <code>[disabled]</code> as <code>aria-disabled="true"</code> instead: the button keeps focus, clicks, <code>routerLink</code> and form submission are swallowed, and <code>disabledReason</code> is read through <code>aria-describedby</code> while (and only while) the button is disabled. Tab to the Publish button and toggle the permission to hear the difference.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxButton'],
  moduleImports: ["import { CngxButton } from '@cngx/common/button';"],
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
  protected handleToggle(): void {
    this.canPublish.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleToggle()">{{ canPublish() ? 'Revoke' : 'Grant' }} editor role</button>
  </div>
  <div class="status-row">Published {{ published() }} time(s)</div>`,
};
