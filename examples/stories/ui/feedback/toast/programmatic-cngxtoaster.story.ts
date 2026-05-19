import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Programmatic (CngxToaster)',
  subtitle: 'Inject <code>CngxToaster</code> and call <code>.show()</code>. Four severity levels, dedup, action buttons.',
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
  <div style="display:flex;flex-wrap:wrap;gap:8px">
    <button (click)="showSuccess()" class="chip">Success</button>
    <button (click)="showError()" class="chip">Error (persistent)</button>
    <button (click)="showInfo()" class="chip">Info</button>
    <button (click)="showWarning()" class="chip">Warning</button>
    <button (click)="showWithAction()" class="chip">With Undo Action</button>
    <button (click)="showDuplicates()" class="chip">5x Dedup</button>
    <button (click)="clearAll()" class="chip">Clear All</button>
  </div>`,
};
