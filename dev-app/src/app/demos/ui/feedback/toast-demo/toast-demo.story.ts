import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Toast',
  navLabel: 'Toast',
  navCategory: 'feedback',
  description: 'Programmatic and declarative toast notifications with dedup, timer pause on hover/touch, and severity-based styling.',
  apiComponents: ['CngxToastOutlet', 'CngxToastOn', 'CngxToaster'],
  moduleImports: [
    "import { CngxToaster } from '@cngx/ui/feedback';",
  ],
  setup: `
  private readonly toaster = inject(CngxToaster);

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
  }
  `,
  sections: [
    {
      title: 'Severity Variants',
      subtitle: 'Four severity levels. Error toasts are persistent by default.',
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px">
    <button (click)="showSuccess()" class="chip">Success</button>
    <button (click)="showError()" class="chip">Error (persistent)</button>
    <button (click)="showInfo()" class="chip">Info</button>
    <button (click)="showWarning()" class="chip">Warning</button>
    <button (click)="clearAll()" class="chip">Clear All</button>
  </div>`,
    },
    {
      title: 'Action Button + Dedup',
      subtitle: 'Toast with undo action. Click "Duplicates" to test dedup counter.',
      template: `
  <div style="display:flex;gap:8px">
    <button (click)="showWithAction()" class="chip">Delete with Undo</button>
    <button (click)="showDuplicates()" class="chip">5x Duplicates</button>
  </div>`,
    },
  ],
};
