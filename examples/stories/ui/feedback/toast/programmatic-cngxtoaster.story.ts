import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToaster: programmatic',
  subtitle: 'Inject <code>CngxToaster</code> and call <code>.show()</code>. Four severity levels, dedup, action buttons.',
  description: 'Service-driven path: <code>inject(CngxToaster).show({...})</code> from anywhere a service can reach. Covers four severities, an Undo action, the 5x dedup behaviour, and a global dismiss.',
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
  protected showSuccess(): void {
    this.toaster.show({ message: 'Item saved successfully', severity: 'success' });
  }
  protected showError(): void {
    this.toaster.show({ message: 'Failed to save item', severity: 'error' });
  }
  protected showInfo(): void {
    this.toaster.show({ message: 'New version available', severity: 'info' });
  }
  protected showWarning(): void {
    this.toaster.show({ message: 'Disk space running low', severity: 'warning' });
  }
  protected showWithAction(): void {
    this.toaster.show({
      message: 'Item deleted',
      severity: 'info',
      action: { label: 'Undo', handler: () => this.toaster.show({ message: 'Undo successful', severity: 'success' }) },
    });
  }
  protected showDuplicates(): void {
    for (let i = 0; i < 5; i++) {
      this.toaster.show({ message: 'Batch operation complete', severity: 'success' });
    }
  }
  protected clearAll(): void {
    this.toaster.dismissAll();
  }`,
  template: `
  <div class="button-row">
    <button (click)="showSuccess()" class="chip" type="button">Success</button>
    <button (click)="showError()" class="chip" type="button">Error (persistent)</button>
    <button (click)="showInfo()" class="chip" type="button">Info</button>
    <button (click)="showWarning()" class="chip" type="button">Warning</button>
    <button (click)="showWithAction()" class="chip" type="button">With Undo Action</button>
    <button (click)="showDuplicates()" class="chip" type="button">5x Dedup</button>
    <button (click)="clearAll()" class="chip" type="button">Clear All</button>
  </div>`,
};
