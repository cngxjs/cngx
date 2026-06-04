import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToast: declarative toast',
  subtitle: 'Place <code>&lt;cngx-toast&gt;</code> in your template. It renders nothing - pushes into the global outlet when <code>[when]</code> becomes <code>true</code>.',
  description: 'Template-driven path: declarative <code>&lt;cngx-toast&gt;</code> instances bound to boolean signals. The element renders nothing locally; setting <code>[when]</code> truthy schedules a push into the global outlet, then the boolean resets so the toast life cycle stays declarative.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
  ],
  apiComponents: [
    'CngxToastOutlet',
    'CngxToastOn',
    'CngxToaster',
    'CngxToast',
  ],
  moduleImports: [
    'import { CngxToast } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxToast'],
  setup: `protected readonly showSaved = signal(false);
  protected readonly showDeleted = signal(false);
  protected triggerSave(): void {
    this.showSaved.set(true);
    setTimeout(() => this.showSaved.set(false), 100);
  }
  protected triggerDelete(): void {
    this.showDeleted.set(true);
    setTimeout(() => this.showDeleted.set(false), 100);
  }`,
  template: `
  <div class="button-row">
    <button (click)="triggerSave()" class="chip" type="button">Save Item</button>
    <button (click)="triggerDelete()" class="chip" type="button">Delete Item</button>
  </div>

  <cngx-toast severity="success" message="Item saved" [when]="showSaved()" />
  <cngx-toast severity="warning" message="Item deleted - this cannot be undone" [when]="showDeleted()" [duration]="8000" />`,
};
