import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFieldSkinHost: bare skin as an inline cell editor',
  subtitle: 'Switch a table row into edit mode and each cell renders a real <code>&lt;input&gt;</code> inside <code>&lt;cngx-form-field skin="bare"&gt;</code>. The cell keeps its size and border; the input paints nothing at rest, shows the focus ring while editing, and tints its text with a thin danger ring when the value is invalid.',
  description: 'The field keeps its full contract inside the cell: a visually hidden <code>cngxLabel</code> names the input, and <code>aria-invalid</code> plus <code>aria-errormessage</code> flip when a touched value breaks a rule. A 24px row has no room for a message block, so each cell wraps <code>&lt;cngx-field-errors&gt;</code> in a visually hidden element: it is the element <code>aria-errormessage</code> points to and it makes the one announcement. The visible copy below the table is <code>aria-hidden</code> so the message is not read twice. Clear the name, then leave the cell to see both. This demo covers only the skin. It does not implement the edit grammar (Enter to commit, Escape to revert, announcing the saved value), which is a separate concern and not part of the field skins.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['visual-variants', 'error-handling'],
  framework: 'signal-forms',
  apiComponents: ['CngxFieldSkinHost', 'CngxFormField', 'CngxFieldErrors'],
  moduleImports: [
    'import { form, schema, required, minLength, FormField } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors } from \'@cngx/forms/field\';',
    'import { CngxInput } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxInput', 'FormField'],
  references: [
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
  ],
  css: `/* The cell hands its padding to the input, which carries the same
   box padding, so entering edit mode moves no text. */
td:has([data-skin='bare']) {
  padding: 0;
}`,
  setup: `private readonly model = signal({ name: 'Alice Schmidt', role: 'Engineer' });
  protected readonly rowForm = form(this.model, schema<{ name: string; role: string }>((root) => {
    required(root.name, { message: 'Name is required.' });
    minLength(root.name, 3, { message: 'Name needs at least 3 characters.' });
    required(root.role, { message: 'Role is required.' });
  }));
  protected readonly editing = signal(false);`,
  setupChrome: `  protected handleToggleEdit(): void {
    this.editing.update((value) => !value);
  }`,
  template: `  <table class="demo-skin-table">
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Role</th>
        <th scope="col">Location</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        @if (editing()) {
          <td>
            <cngx-form-field skin="bare" [field]="rowForm.name">
              <label cngxLabel class="cngx-sr-only">Name</label>
              <input cngxInput [formField]="rowForm.name" />
              <div class="cngx-sr-only"><cngx-field-errors /></div>
            </cngx-form-field>
          </td>
          <td>
            <cngx-form-field skin="bare" [field]="rowForm.role">
              <label cngxLabel class="cngx-sr-only">Role</label>
              <input cngxInput [formField]="rowForm.role" />
              <div class="cngx-sr-only"><cngx-field-errors /></div>
            </cngx-form-field>
          </td>
        } @else {
          <td>{{ rowForm.name().value() }}</td>
          <td>{{ rowForm.role().value() }}</td>
        }
        <td>Berlin</td>
      </tr>
      <tr>
        <td>Bob Müller</td>
        <td>Designer</td>
        <td>London</td>
      </tr>
    </tbody>
  </table>
  @if (editing()) {
    <ul class="demo-cell-errors" aria-hidden="true">
      @for (field of [rowForm.name, rowForm.role]; track $index) {
        @if (field().touched() && field().invalid()) {
          @for (error of field().errors(); track error.kind) {
            <li>{{ error.message }}</li>
          }
        }
      }
    </ul>
  }`,
  templateChrome: `<div class="button-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="handleToggleEdit()">
        {{ editing() ? 'Done editing' : 'Edit first row' }}
      </button>
    </div>`,
};
