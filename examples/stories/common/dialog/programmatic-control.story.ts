import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialog: Programmatic control via viewChild',
  subtitle: 'Open and close from component code via <code>viewChild</code>. The <code>result()</code> signal feeds into <code>computed()</code>: no subscriptions, no event handlers, pure reactive derivation.',
  description: 'viewChild grabs the dialog instance, computed() derives a status message from result(). Demonstrates that programmatic open/close stays compatible with the same Signal-driven contract the template-bound stories use.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'CngxDialog',
    'CngxDialogTitle',
  ],
  moduleImports: [
    'import { CngxDialog, CngxDialogTitle } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle'],
  setup: `protected readonly progDialog = viewChild<CngxDialog<'saved' | 'discarded'>>('progDialog');
  protected readonly progMessage = computed(() => {
    const result = this.progDialog()?.result();
    if (result === undefined) return 'No dialog result yet.';
    if (result === 'dismissed') return 'Dialog was dismissed (Escape or backdrop).';
    return 'Dialog returned: ' + String(result);
  });`,
  setupChrome: `  protected handleOpenProgrammatic(): void {
    this.progDialog()?.open();
  }
  protected handleSaveProgrammatic(): void {
    this.progDialog()?.close('saved');
  }
  protected handleDiscardProgrammatic(): void {
    this.progDialog()?.close('discarded');
  }`,
  template: `  <button type="button" class="chip" (click)="handleOpenProgrammatic()">Open from Code</button>

  <dialog cngxDialog #progDialog="cngxDialog">
    <h2 cngxDialogTitle>Unsaved Changes</h2>
    <p style="margin:12px 0">You have unsaved changes. What would you like to do?</p>
    <div class="button-row" style="justify-content:flex-end">
      <button type="button" class="chip" (click)="handleDiscardProgrammatic()">Discard</button>
      <button type="button" class="chip chip--active" (click)="handleSaveProgrammatic()">Save</button>
    </div>
  </dialog>

  <div class="code-block" style="margin-top:12px">
    {{ progMessage() }}
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="status-badge">state: {{ progDialog.lifecycle() }}</span>
    <span class="status-badge">result: {{ progDialog.result() ?? 'undefined' }}</span>
  </div>`,
};
