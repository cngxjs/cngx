import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Template Directives',
  subtitle: 'The dialog is composed from focused directives: <code>cngxDialogTitle</code> auto-wires <code>aria-labelledby</code>, <code>cngxDialogDescription</code> wires <code>aria-describedby</code>, <code>cngxDialogClose</code> handles close with a typed value or dismiss without one. Each directive generates deterministic ARIA IDs — no manual <code>id</code> management.',
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
    'import { FormsModule } from \'@angular/forms\';',
    'import { JsonPipe } from \'@angular/common\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogDescription', 'CngxDialogClose', 'FormsModule', 'JsonPipe'],
  setup: `protected readonly formData = { name: '', email: '' };`,
  template: `  <button class="chip" (click)="tmplDlg.open()">Edit Profile</button>

  <dialog cngxDialog #tmplDlg="cngxDialog">
    <!-- cngxDialogTitle: sets aria-labelledby on the dialog -->
    <h2 cngxDialogTitle>Edit Profile</h2>

    <!-- cngxDialogDescription: sets aria-describedby on the dialog -->
    <p cngxDialogDescription>Update your name and email. Changes are saved immediately.</p>

    <form style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px; min-width: 300px;"
          (ngSubmit)="tmplDlg.close({ name: formData.name, email: formData.email })">
      <label>
        Name
        <input [(ngModel)]="formData.name" name="name"
          style="display: block; width: 100%; margin-top: 4px; padding: 6px 8px; border: 1px solid var(--cngx-color-border); border-radius: 4px;" />
      </label>
      <label>
        Email
        <input [(ngModel)]="formData.email" name="email" type="email"
          style="display: block; width: 100%; margin-top: 4px; padding: 6px 8px; border: 1px solid var(--cngx-color-border); border-radius: 4px;" />
      </label>
      
    </form>
  </dialog>`,
  templateChrome: `<div class="button-row" style="justify-content: flex-end;">
        <!-- cngxDialogClose without value: calls dismiss() -->
        <button type="button" class="chip" cngxDialogClose>Cancel</button>
        <!-- Form submit calls close() with the typed result -->
        <button type="submit" class="chip chip--active">Save</button>
      </div>
<div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ tmplDlg.lifecycle() }}</span>
    <span class="status-badge">result: {{ tmplDlg.result() | json }}</span>
  </div>`,
};
