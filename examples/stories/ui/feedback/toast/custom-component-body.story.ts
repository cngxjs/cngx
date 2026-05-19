import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom Component Body',
  subtitle: 'Pass a <code>content</code> component to <code>ToastConfig</code> for rich toast bodies. Rendered via <code>NgComponentOutlet</code>.',
  description: 'Programmatic and declarative toast notifications with dedup, timer pause on hover/touch, and severity-based styling.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
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
  <div style="display:flex;flex-wrap:wrap;gap:8px">
    <button (click)="showCustomComponent()" class="chip">Validation Errors (title + component)</button>
    <button (click)="showCustomNoTitle()" class="chip">Build Report (component only)</button>
  </div>`,
};
