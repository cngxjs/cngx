import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialogOpener: Programmatic open',
  subtitle: 'For fully programmatic dialogs (no <code>&lt;dialog&gt;</code> in the template) use <code>CngxDialogOpener</code>. Requires <code>provideDialog()</code> in providers. Returns a typed <code>CngxDialogRef</code> with Signal-based result and Observable compat.',
  description: 'The imperative escape hatch when a declarative <dialog> in the template is impractical (opening from a service, or when the dialog component lives in a separate feature). The button below opens an inline content component via opener.open() and reflects the typed result back via the returned ref.result() signal.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: [
    'CngxDialogOpener',
    'CngxDialogRef',
  ],
  moduleImports: [
    'import { CngxDialogOpener, type CngxDialogRef } from \'@cngx/common/dialog\';',
    'import { ProgrammaticDialogContent, type ProgrammaticDialogData } from \'./_programmatic-dialog-content.component\';',
  ],
  setup: `private readonly opener = inject(CngxDialogOpener);
  protected readonly openedRef = signal<CngxDialogRef<'cancel' | 'confirm'> | null>(null);
  protected readonly lastResult = computed(() => this.openedRef()?.result() ?? '-');

  protected handleOpenProgrammatic(): void {
    const ref = this.opener.open<'cancel' | 'confirm', ProgrammaticDialogData>(
      ProgrammaticDialogContent,
      {
        data: {
          heading: 'Confirm action',
          body: 'This dialog component lives in a separate file. It was opened by calling opener.open(Component, { data }) - no <dialog> in this template.',
        },
      },
    );
    this.openedRef.set(ref);
  }`,
  templateChromeBefore: `<div class="code-block" style="margin-bottom:16px">
    <strong>CngxDialogOpener</strong> is the imperative escape hatch for cases where
    a declarative &lt;dialog&gt; in the template is impractical (opening a dialog
    from a service, or when the dialog component lives in a separate feature).
    <br><br>
    Key points:
    <ul style="margin:8px 0 0;padding-left:20px">
      <li><code>provideDialog()</code> must be in providers (app or feature level)</li>
      <li><code>dialog.open(Component, config)</code> returns a typed <code>CngxDialogRef</code></li>
      <li>Inject <code>CNGX_DIALOG_DATA</code> in the dialog component to receive data</li>
      <li><code>ref.result()</code> is a Signal: use in computed() or effect()</li>
      <li><code>ref.close(value)</code> sets the result and closes the dialog</li>
      <li>The declarative &lt;dialog cngxDialog&gt; approach (shown in the other stories) covers most use cases</li>
    </ul>
  </div>`,
  template: `  <button type="button" class="chip chip--active" (click)="handleOpenProgrammatic()">
    Open programmatic dialog
  </button>`,
  templateChrome: `<div class="status-row" style="margin-top:12px">
    <span class="status-badge">Last result: {{ lastResult() ?? '-' }}</span>
  </div>`,
};
