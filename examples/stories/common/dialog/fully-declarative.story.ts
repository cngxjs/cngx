import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Fully Declarative',
  subtitle: 'Zero TypeScript — everything lives in the template. <code>#dlg="cngxDialog"</code> exposes the full <code>DialogRef</code> API: <code>open()</code>, <code>close(value)</code>, <code>dismiss()</code>, <code>state()</code>, <code>result()</code>.',
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
    'import { CngxDialog, CngxDialogTitle, CngxDialogDescription, CngxDialogClose } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogDescription', 'CngxDialogClose'],
  template: `  <button class="chip" (click)="declDlg.open()">Delete Item</button>

  <dialog cngxDialog #declDlg="cngxDialog">
    <h2 cngxDialogTitle>Delete item?</h2>
    <p cngxDialogDescription>This action cannot be undone. The item will be permanently removed.</p>
    
  </dialog>`,
  templateChrome: `<div class="button-row" style="margin-top: 16px; justify-content: flex-end;">
      <button class="chip" [cngxDialogClose]="false">Cancel</button>
      <button class="chip chip--active" [cngxDialogClose]="true">Delete</button>
    </div>
<div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ declDlg.lifecycle() }}</span>
    <span class="status-badge">result: {{ declDlg.result() ?? 'undefined' }}</span>
  </div>`,
};
