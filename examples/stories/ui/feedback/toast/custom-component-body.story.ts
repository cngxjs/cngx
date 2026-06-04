import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToaster: custom component body',
  subtitle: 'Pass a <code>content</code> component to <code>ToastConfig</code> for rich toast bodies. Rendered via <code>NgComponentOutlet</code>.',
  description: 'Component-projection variant: a separate Angular component is passed as <code>content</code> with typed <code>contentInputs</code>. Use when the toast body is complex enough to deserve its own template/file.',
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
    'import { CngxToaster } from \'@cngx/ui/feedback\';',
    'import { SampleToastBody } from \'./sample-toast-body\';',
  ],
  setup: `private readonly toaster = inject(CngxToaster);
  protected showCustomComponent(): void {
    this.toaster.show({
      message: 'Validation failed',
      title: '3 Errors',
      severity: 'error',
      content: SampleToastBody,
      contentInputs: { fields: ['Name is required', 'Email is invalid', 'ZIP must be 5 digits'] },
    });
  }
  protected showCustomNoTitle(): void {
    this.toaster.show({
      message: 'Details',
      severity: 'info',
      content: SampleToastBody,
      contentInputs: { fields: ['Build #1234 completed', 'Tests: 754 passed, 0 failed', 'Coverage: 92%'] },
    });
  }`,
  template: `
  <div class="button-row">
    <button (click)="showCustomComponent()" class="chip" type="button">Validation Errors (title + component)</button>
    <button (click)="showCustomNoTitle()" class="chip" type="button">Build Report (component only)</button>
  </div>`,
};
