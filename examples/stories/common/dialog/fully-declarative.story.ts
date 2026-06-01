import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialog: Fully declarative',
  subtitle: 'Zero TypeScript: everything lives in the template. <code>#dlg="cngxDialog"</code> exposes the full <code>DialogRef</code> API: <code>open()</code>, <code>close(value)</code>, <code>dismiss()</code>, <code>state()</code>, <code>result()</code>.',
  description: 'The whole open/close/result loop wired in the template via the dialog template-ref. cngxDialogClose carries the typed payload, the host signals (state, result) drive the chrome readout. No class members needed.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG: Dialog (modal)', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' },
  ],
  apiComponents: [
    'CngxDialog',
    'CngxDialogTitle',
    'CngxDialogDescription',
    'CngxDialogClose',
  ],
  moduleImports: [
    'import { CngxDialog, CngxDialogTitle, CngxDialogDescription, CngxDialogClose } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogDescription', 'CngxDialogClose'],
  template: `  <button type="button" class="chip" (click)="declDlg.open()">Delete Item</button>

  <dialog cngxDialog #declDlg="cngxDialog">
    <h2 cngxDialogTitle>Delete item?</h2>
    <p cngxDialogDescription>This action cannot be undone. The item will be permanently removed.</p>
    <div class="button-row" style="margin-top:16px;justify-content:flex-end">
      <button type="button" class="chip" [cngxDialogClose]="false">Cancel</button>
      <button type="button" class="chip chip--active" [cngxDialogClose]="true">Delete</button>
    </div>
  </dialog>`,
  templateChrome: `<div class="status-row" style="margin-top:12px">
    <span class="status-badge">state: {{ declDlg.lifecycle() }}</span>
    <span class="status-badge">result: {{ declDlg.result() ?? 'undefined' }}</span>
  </div>`,
};
