import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Toast',
  navLabel: 'Toast',
  navCategory: 'feedback',
  description: 'Programmatic and declarative toast notifications with dedup, timer pause on hover/touch, and severity-based styling.',
  apiComponents: ['CngxToastOutlet', 'CngxToastOn', 'CngxToaster', 'CngxToast'],
  moduleImports: [
    "import { CngxToaster, CngxToast, CngxToastOn } from '@cngx/ui/feedback';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
  private readonly toaster = inject(CngxToaster);

  // ── Programmatic demos ──
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

  // ── Declarative <cngx-toast> demos ──
  protected readonly showSaved = signal(false);
  protected readonly showDeleted = signal(false);

  protected triggerSave(): void {
    this.showSaved.set(true);
    setTimeout(() => this.showSaved.set(false), 100);
  }

  protected triggerDelete(): void {
    this.showDeleted.set(true);
    setTimeout(() => this.showDeleted.set(false), 100);
  }

  // ── Declarative [cngxToastOn] demo ──
  protected readonly saveState = createManualState<string>();

  protected simulateSave(): void {
    this.saveState.set('pending');
    setTimeout(() => this.saveState.setSuccess('done'), 1500);
  }

  protected simulateError(): void {
    this.saveState.set('pending');
    setTimeout(() => this.saveState.setError('Network timeout'), 1500);
  }
  `,
  sections: [
    {
      title: 'Programmatic (CngxToaster)',
      subtitle: 'Inject <code>CngxToaster</code> and call <code>.show()</code>. Four severity levels, dedup, action buttons.',
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
    },
    {
      title: 'Declarative (<cngx-toast>)',
      subtitle: 'Place <code>&lt;cngx-toast&gt;</code> in your template. It renders nothing — pushes into the global outlet when <code>[when]</code> becomes <code>true</code>.',
      imports: ['CngxToast'],
      template: `
  <div style="display:flex;gap:8px">
    <button (click)="triggerSave()" class="chip">Save Item</button>
    <button (click)="triggerDelete()" class="chip">Delete Item</button>
  </div>

  <cngx-toast severity="success" message="Item saved" [when]="showSaved()" />
  <cngx-toast severity="warning" message="Item deleted — this cannot be undone" [when]="showDeleted()" [duration]="8000" />`,
    },
    {
      title: 'State Bridge ([cngxToastOn])',
      subtitle: 'Bind a <code>CngxAsyncState</code> — fires toast automatically on <code>success</code> or <code>error</code> transitions.',
      imports: ['CngxToastOn'],
      template: `
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="simulateSave()"
      [cngxToastOn]="saveState" toastSuccess="Saved successfully" toastError="Save failed" [toastErrorDetail]="true"
      class="chip">
      {{ saveState.isPending() ? 'Saving...' : 'Save (1.5s)' }}
    </button>
    <button (click)="simulateError()"
      class="chip">
      Simulate Error (1.5s)
    </button>
  </div>

  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ saveState.status() }}</span>
    </div>
  </div>`,
    },
  ],
};
