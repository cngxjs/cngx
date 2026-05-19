import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Programmatic Control',
  subtitle: 'Open and close from component code via <code>viewChild</code>. The <code>result()</code> signal feeds into <code>computed()</code> — no subscriptions, no event handlers, pure reactive derivation.',
  description: 'Signal-driven state machine for native <dialog>. Typed results, deterministic focus return, ARIA communication, CSS transition support, and opt-in draggable behavior.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxDialog',
    'CngxDialogTitle',
    'CngxDialogDescription',
    'CngxDialogClose',
    'CngxDialogDraggable',
    'CngxDialogStack',
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
  template: `  <dialog cngxDialog #progDialog="cngxDialog">
    <h2 cngxDialogTitle>Unsaved Changes</h2>
    <p style="margin: 12px 0;">You have unsaved changes. What would you like to do?</p>
    
  </dialog>

  <div class="code-block" style="margin-top: 12px">
    {{ progMessage() }}
  </div>`,
  templateChrome: `<div class="button-row">
    <button class="chip" (click)="handleOpenProgrammatic()">Open from Code</button>
  </div>
<div class="button-row" style="justify-content: flex-end;">
      <button class="chip" (click)="handleDiscardProgrammatic()">Discard</button>
      <button class="chip chip--active" (click)="handleSaveProgrammatic()">Save</button>
    </div>
<div class="status-row" style="margin-top: 8px">
    <span class="status-badge">state: {{ progDialog.lifecycle() }}</span>
    <span class="status-badge">result: {{ progDialog.result() ?? 'undefined' }}</span>
  </div>`,
};
