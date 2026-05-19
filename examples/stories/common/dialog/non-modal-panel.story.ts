import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Non-Modal Panel',
  subtitle: 'Opens with <code>[modal]="false"</code> via <code>dialog.show()</code>. No focus trap, no backdrop, no <code>aria-modal</code>. The page remains fully interactive behind the dialog.',
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
    'import { CngxDialog, CngxDialogTitle, CngxDialogClose } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose'],
  template: `  <button class="chip" (click)="panelDlg.open()">Show Help Panel</button>

  <dialog cngxDialog [modal]="false" #panelDlg="cngxDialog"
    style="position: fixed; top: 80px; right: 24px; border: 1px solid var(--cngx-color-border); border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <h3 cngxDialogTitle>Quick Help</h3>
    <p style="max-width: 240px; margin: 8px 0;">This is a non-modal panel. You can still interact with the page behind it.</p>
    <button class="chip" cngxDialogClose>Close</button>
  </dialog>`,
  templateChrome: `<div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ panelDlg.lifecycle() }}</span>
    <span class="status-badge">modal: false</span>
  </div>`,
};
