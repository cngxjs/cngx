import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialog: Alert dialog (role="alertdialog")',
  subtitle: 'Switches the host role to <code>alertdialog</code> and disables backdrop close. Only the explicit OK button can close it. Screen readers announce the urgency.',
  description: 'When the user must acknowledge an interrupting message, role="alertdialog" combined with [closeOnBackdropClick]="false" prevents accidental dismissal. The only path out is the typed cngxDialogClose action.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG: Alert Dialog', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/' },
  ],
  apiComponents: [
    'CngxDialog',
    'CngxDialogTitle',
    'CngxDialogClose',
  ],
  moduleImports: [
    'import { CngxDialog, CngxDialogTitle, CngxDialogClose } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose'],
  template: `  <button class="chip" (click)="alertDlg.open()">Show Alert</button>

  <dialog cngxDialog role="alertdialog" [closeOnBackdropClick]="false" #alertDlg="cngxDialog">
    <h2 cngxDialogTitle>Session Expired</h2>
    <p>Your session has expired. Please log in again to continue.</p>
    <div class="button-row" style="margin-top:16px;justify-content:flex-end">
      <button class="chip chip--active" [cngxDialogClose]="undefined">OK</button>
    </div>
  </dialog>`,
  templateChrome: `<div class="status-row" style="margin-top:12px">
    <span class="status-badge">state: {{ alertDlg.lifecycle() }}</span>
  </div>`,
};
