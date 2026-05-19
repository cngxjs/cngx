import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async Click',
  navLabel: 'Async Click',
  navCategory: 'interactive',
  description:
    'Async button handler with loading state, auto-disable, success/error feedback, and double-click protection.',
  apiComponents: ['CngxAsyncClick'],
  overview:
    '<p><code>CngxAsyncClick</code> handles async actions on any clickable element. ' +
    'Auto-disables during execution, shows pending/succeeded/failed states via signals and CSS classes, ' +
    'and guards against double-clicks. Works with plain buttons and Material buttons.</p>',
  moduleImports: [
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
    "import { CngxActionButton, CngxPending, CngxSucceeded, CngxFailed } from '@cngx/ui';",
    "import { CngxToastOn, CngxToaster } from '@cngx/ui/feedback';",
    "import { MatButtonModule } from '@angular/material/button';",
    "import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';",
    "import { SampleToastBody } from '../../../ui/feedback/toast-demo/sample-toast-body';",
  ],
  setup: `
  // Fake API call that succeeds after 1.5s
  protected readonly saveAction = () => new Promise<void>(resolve => setTimeout(resolve, 1500));

  // Fake API call that fails after 1s
  protected readonly deleteAction = () => new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Server error: 403 Forbidden')), 1000),
  );

  // Fake API call with random outcome
  protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), 1200),
  );

  // Fake API call that fails with validation errors
  protected readonly validateAction = () => new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Validation failed')), 1000),
  );

  // Programmatic toast with custom component body
  private readonly toaster = inject(CngxToaster);

  protected showCustomToast(): void {
    this.toaster.show({
      message: 'Validation failed',
      title: '3 Errors',
      severity: 'error',
      content: SampleToastBody,
      contentInputs: { fields: ['Name is required', 'Email is invalid', 'ZIP must be 5 digits'] },
    });
  }
  `,
  sections: [
    {
      title: 'Save Action (Success)',
      subtitle:
        'Click to trigger a 1.5s fake save. The button is auto-disabled while pending. ' +
        'Success feedback shows for 2 seconds, then resets.',
      imports: ['CngxAsyncClick'],
      template: `
  <div class="button-row">
    <button [cngxAsyncClick]="saveAction" #save="cngxAsyncClick" class="chip"
      [style.background]="save.succeeded() ? 'var(--success-bg, #e8f5e9)' : ''"
      [style.borderColor]="save.succeeded() ? 'var(--success-fg, #2e7d32)' : ''">
      @if (save.pending()) {
        Saving...
      } @else if (save.succeeded()) {
        Saved
      } @else {
        Save Draft
      }
    </button>
  </div>
  <div class="status-row" style="margin-top:12px">
    <span class="status-badge">pending: {{ save.pending() }}</span>
    <span class="status-badge">succeeded: {{ save.succeeded() }}</span>
    <span class="status-badge">failed: {{ save.failed() }}</span>
  </div>`,
    },
    {
      title: 'Delete Action (Failure)',
      subtitle:
        'Click to trigger a 1s fake delete that always fails. Error feedback shows for 2 seconds. ' +
        'The <code>error()</code> signal contains the rejection reason.',
      imports: ['CngxAsyncClick'],
      template: `
  <div class="button-row">
    <button [cngxAsyncClick]="deleteAction" #del="cngxAsyncClick" class="chip"
      [style.background]="del.failed() ? 'var(--cngx-field-error-color, #ffebee)' : ''"
      [style.color]="del.failed() ? '#c62828' : ''">
      @if (del.pending()) {
        Deleting...
      } @else if (del.failed()) {
        Failed
      } @else {
        Delete Account
      }
    </button>
  </div>
  <div class="status-row" style="margin-top:12px">
    <span class="status-badge">pending: {{ del.pending() }}</span>
    <span class="status-badge">failed: {{ del.failed() }}</span>
    @if (del.error(); as err) {
      <span class="status-badge" style="color:#c62828">{{ err }}</span>
    }
  </div>`,
    },
    {
      title: 'Material Button',
      subtitle:
        'Works with <code>mat-raised-button</code> out of the box. The Material disabled style ' +
        'activates automatically via the native <code>disabled</code> attribute.',
      imports: ['CngxAsyncClick', 'MatButtonModule', 'MatProgressSpinnerModule'],
      template: `
  <div class="button-row" style="gap:12px">
    <button mat-raised-button color="primary" [cngxAsyncClick]="submitAction" #sub="cngxAsyncClick">
      @if (sub.pending()) {
        <mat-spinner diameter="20" style="display:inline-block;margin-right:8px" />
        Submitting...
      } @else if (sub.succeeded()) {
        Submitted
      } @else if (sub.failed()) {
        Try Again
      } @else {
        Submit Form
      }
    </button>

    <button mat-stroked-button [cngxAsyncClick]="saveAction" #save2="cngxAsyncClick">
      @if (save2.pending()) {
        Saving...
      } @else if (save2.succeeded()) {
        Saved
      } @else {
        Save as Draft
      }
    </button>
  </div>
  <div class="status-row" style="margin-top:12px">
    <span class="status-badge">Submit: {{ sub.pending() ? 'pending' : sub.succeeded() ? 'ok' : sub.failed() ? 'failed' : 'idle' }}</span>
    <span class="status-badge">Draft: {{ save2.pending() ? 'pending' : save2.succeeded() ? 'ok' : 'idle' }}</span>
  </div>`,
    },
    {
      title: 'Async Button (Organism)',
      subtitle:
        '<code>cngx-action-button</code> eliminates the <code>@if</code> boilerplate. ' +
        'Use string labels for simple cases or <code>cngxPending</code>/<code>cngxSucceeded</code>/<code>cngxFailed</code> ' +
        'templates for custom UI per state.',
      imports: ['CngxActionButton', 'CngxPending', 'CngxSucceeded', 'CngxFailed', 'MatProgressSpinnerModule'],
      template: `
  <div style="display:flex;flex-direction:column;gap:24px">
    <div>
      <p class="demo-label">String labels (zero boilerplate)</p>
      <div class="button-row" style="gap:12px">
        <cngx-action-button [action]="saveAction" pendingLabel="Saving..." succeededLabel="Saved!" class="chip">
          Save Draft
        </cngx-action-button>
        <cngx-action-button [action]="deleteAction" pendingLabel="Deleting..." failedLabel="Failed!" class="chip">
          Delete
        </cngx-action-button>
      </div>
    </div>

    <div>
      <p class="demo-label">Template slots (custom UI per state)</p>
      <div class="button-row">
        <cngx-action-button [action]="submitAction">
          Submit Order
          <ng-template cngxPending>
            <span style="display:inline-flex;align-items:center;gap:6px">
              <mat-spinner diameter="16" /> Processing...
            </span>
          </ng-template>
          <ng-template cngxSucceeded>Order placed!</ng-template>
          <ng-template cngxFailed let-err>Failed: {{ err }} -- click to retry</ng-template>
        </cngx-action-button>
      </div>
    </div>
  </div>`,
    },
    {
      title: 'State Producer + Toast (title + description)',
      subtitle:
        '<code>CngxAsyncClick</code> exposes <code>state: CngxAsyncState</code>. ' +
        'Bind to <code>[cngxToastOn]</code> for automatic toasts. ' +
        '<code>CngxActionButton</code> has toast inputs built in.',
      imports: ['CngxAsyncClick', 'CngxActionButton', 'CngxToastOn'],
      template: `
  <div style="display:flex;flex-direction:column;gap:24px">
    <div>
      <p class="demo-label">CngxAsyncClick + CngxToastOn (separate elements)</p>
      <div class="button-row">
        <button [cngxAsyncClick]="saveAction" #save3="cngxAsyncClick" class="chip">
          @if (save3.pending()) { Saving... } @else { Save }
        </button>
        <ng-container
          [cngxToastOn]="save3.state"
          toastSuccess="Saved"
          toastError="Save failed" />
      </div>
      <div class="status-row" style="margin-top:8px">
        <span class="status-badge">state.status: {{ save3.state.status() }}</span>
      </div>
    </div>

    <div>
      <p class="demo-label">CngxActionButton with built-in toast inputs</p>
      <div class="button-row" style="gap:12px">
        <cngx-action-button [action]="saveAction"
          toastSuccess="Profile saved"
          toastError="Save failed"
          pendingLabel="Saving..."
          succeededLabel="Saved!"
          class="chip">
          Save Profile
        </cngx-action-button>

        <cngx-action-button [action]="deleteAction"
          toastError="Delete failed"
          [toastErrorDetail]="true"
          pendingLabel="Deleting..."
          failedLabel="Failed"
          class="chip">
          Delete (always fails)
        </cngx-action-button>
      </div>
    </div>
  </div>`,
    },
    {
      title: 'Programmatic Toast with Custom Component',
      subtitle:
        'Use <code>toaster.show()</code> with <code>title</code>, <code>description</code>, or a custom <code>content</code> component.',
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px">
    <button (click)="showCustomToast()" class="chip">
      Show Validation Errors (custom component body)
    </button>
  </div>`,
    },
  ],
};
