import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToaster: title and description',
  subtitle: 'Use <code>title</code> and <code>description</code> on <code>ToastConfig</code> for structured two-line toasts. Description is line-clamped to 3 lines.',
  description: 'Two-line layout variant: every <code>show()</code> here sets both <code>title</code> and <code>description</code>. The third button adds an action so the warning variant exercises title + description + action together.',
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
  ],
  setup: `private readonly toaster = inject(CngxToaster);
  protected showTitleSuccess(): void {
    this.toaster.show({
      message: 'Profile updated',
      title: 'Saved',
      description: 'Your profile changes have been saved successfully.',
      severity: 'success',
      duration: 5000,
    });
  }
  protected showTitleError(): void {
    this.toaster.show({
      message: 'Save failed',
      title: 'Server Error',
      description: 'The server responded with 503 Service Unavailable. Please try again in a few minutes.',
      severity: 'error',
    });
  }
  protected showTitleWithAction(): void {
    this.toaster.show({
      message: 'Connection lost',
      title: 'Offline',
      description: 'Changes saved locally. They will sync when you reconnect.',
      severity: 'warning',
      action: { label: 'Retry now', handler: () => this.toaster.show({ message: 'Reconnecting...', severity: 'info' }) },
    });
  }`,
  template: `
  <div class="button-row">
    <button (click)="showTitleSuccess()" class="chip" type="button">Success with Title</button>
    <button (click)="showTitleError()" class="chip" type="button">Error with Title + Description</button>
    <button (click)="showTitleWithAction()" class="chip" type="button">Warning + Action</button>
  </div>`,
};
