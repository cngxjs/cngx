import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Alert Dialog',
  subtitle: 'Uses <code>role="alertdialog"</code> and disables backdrop close. Only the explicit OK button can close it. Screen readers announce the urgency.',
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
  template: `  <button class="chip" (click)="alertDlg.open()">Show Alert</button>

  <dialog cngxDialog role="alertdialog" [closeOnBackdropClick]="false" #alertDlg="cngxDialog">
    <h2 cngxDialogTitle>Session Expired</h2>
    <p>Your session has expired. Please log in again to continue.</p>
    
  </dialog>`,
  templateChrome: `<div class="button-row" style="margin-top: 16px; justify-content: flex-end;">
      <button class="chip chip--active" [cngxDialogClose]="undefined">OK</button>
    </div>`,
};
