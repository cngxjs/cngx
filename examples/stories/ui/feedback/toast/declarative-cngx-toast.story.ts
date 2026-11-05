import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToast: declarative toast',
  subtitle: 'Place <code>&lt;cngx-toast&gt;</code> in your template. It renders nothing - pushes into the global outlet when <code>[when]</code> becomes <code>true</code>.',
  description: 'Template-driven path: declarative <code>&lt;cngx-toast&gt;</code> instances bound to boolean signals. The element renders nothing locally; setting <code>[when]</code> truthy pushes into the global outlet, and a falling edge dismisses it. Each boolean resets on <code>(dismissed)</code>, so the toast stays up for its own duration and the next click shows it again.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
  ],
  apiComponents: ['CngxToast', 'CngxToastOutlet', 'CngxToastOn', 'CngxToaster'],
  moduleImports: [
    'import { CngxToast } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxToast'],
  setup: `protected readonly showSaved = signal(false);
  protected readonly showDeleted = signal(false);`,
  template: `
  <div class="button-row">
    <button (click)="showSaved.set(true)" class="chip" type="button">Save Item</button>
    <button (click)="showDeleted.set(true)" class="chip" type="button">Delete Item</button>
  </div>

  <cngx-toast severity="success" message="Item saved" [when]="showSaved()" (dismissed)="showSaved.set(false)" />
  <cngx-toast
    severity="warning"
    message="Item deleted - this cannot be undone"
    [when]="showDeleted()"
    [duration]="8000"
    (dismissed)="showDeleted.set(false)"
  />`,
};
