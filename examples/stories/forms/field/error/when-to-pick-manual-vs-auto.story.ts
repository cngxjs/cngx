import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxError: when to pick manual vs auto',
  subtitle: 'Two adjacent fields, same validators. The left one uses <code>&lt;cngx-field-errors&gt;</code> - the registry (or inline <code>message</code>) resolves each error <code>kind</code> to its string. The right one uses <code>&lt;div cngxError&gt;</code> - the consumer renders each error by hand with custom layout. Pick auto for stock per-field error lists. Pick manual when rendering rules vary with the error.',
  description: 'Decision rule, short version. If the messages can be expressed as a flat <code>kind -&gt; string</code> map, <code>CngxFieldErrors</code> is the right slot. The moment per-error styling, icons, links to docs, or conditional copy enter the picture, switch the field to <code>CngxError</code> and own the loop. Never combine both in the same form-field: their <code>aria-hidden</code> + <code>role="alert"</code> would collide on the same error container.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxError', 'CngxFieldErrors', 'CngxFormField', 'CngxLabel'],
  moduleImports: [
    'import { form, schema, required, minLength } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxError, CngxFieldErrors } from \'@cngx/forms/field\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxError', 'CngxFieldErrors'],
  setup: `protected readonly model = signal<{ autoName: string; manualName: string }>({ autoName: '', manualName: '' });
  protected readonly userForm = form(this.model, schema<{ autoName: string; manualName: string }>((root) => {
    required(root.autoName, { message: 'This field is required' });
    minLength(root.autoName, 3, { message: 'At least 3 characters' });
    required(root.manualName, { message: 'This field is required' });
    minLength(root.manualName, 3, { message: 'At least 3 characters' });
  }));`,
  template: `  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:720px">

    <section style="display:grid;gap:8px">
      <h3 style="margin:0">Auto: cngx-field-errors</h3>
      <cngx-form-field [field]="userForm.autoName">
        <label cngxLabel for="pick-auto-name">Display name</label>
        <input
          id="pick-auto-name"
          type="text"
          [value]="userForm.autoName().value()"
          (input)="userForm.autoName().value.set($any($event.target).value)"
          (blur)="userForm.autoName().markAsTouched()"
        />
        <cngx-field-errors />
      </cngx-form-field>
      <p style="margin:0">
        Registry resolves each <code>kind</code>. One template, one paragraph per error. Inline <code>message</code> on the validator is the fallback path.
      </p>
    </section>

    <section style="display:grid;gap:8px">
      <h3 style="margin:0">Manual: div cngxError</h3>
      <cngx-form-field [field]="userForm.manualName">
        <label cngxLabel for="pick-manual-name">Display name</label>
        <input
          id="pick-manual-name"
          type="text"
          [value]="userForm.manualName().value()"
          (input)="userForm.manualName().value.set($any($event.target).value)"
          (blur)="userForm.manualName().markAsTouched()"
        />
        <div cngxError style="display:grid;gap:4px;margin-top:6px">
          @for (e of userForm.manualName().errors(); track e.kind) {
            <p style="display:flex;align-items:flex-start;gap:6px;margin:0">
              <span aria-hidden="true">&bull;</span>
              <span>
                <strong style="">{{ e.kind }}</strong>
                {{ e.message }}
              </span>
            </p>
          }
        </div>
      </cngx-form-field>
      <p style="margin:0">
        Consumer owns the loop. Per-error markup, icons, links, copy.
      </p>
    </section>

  </div>`,
};
