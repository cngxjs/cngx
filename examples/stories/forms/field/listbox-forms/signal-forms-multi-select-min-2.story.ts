import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxListboxFieldBridge: signal forms multi select min 2',
  subtitle: 'Multi-select with a <code>minLength</code> validator. Selection pushed into the field array.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxListboxFieldBridge',
    'CngxListbox',
    'CngxOption',
    'CngxFormField',
  ],
  moduleImports: [
    'import { form, schema, minLength } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, CngxListboxFieldBridge } from \'@cngx/forms/field\';',
    'import { CngxListbox, CngxOption } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxListbox', 'CngxOption', 'CngxListboxFieldBridge'],
  setup: `private readonly multiModel = signal<{ toppings: string[] }>({ toppings: [] });
  private readonly multiSchema = schema<{ toppings: string[] }>((root) => {
    minLength(root.toppings, 2);
  });
  protected readonly multiForm = form(this.multiModel, this.multiSchema);`,
  template: `  <cngx-form-field [field]="multiForm.toppings">
    <label cngxLabel>Toppings (at least 2)</label>
    <div cngxListbox
         cngxListboxFieldBridge
         [label]="'Toppings'"
         [multiple]="true"
         tabindex="0">
      <div cngxOption value="cheese">Cheese</div>
      <div cngxOption value="pepperoni">Pepperoni</div>
      <div cngxOption value="mushroom">Mushroom</div>
      <div cngxOption value="olive">Olive</div>
      <div cngxOption value="onion">Onion</div>
    </div>
    <cngx-field-errors />
  </cngx-form-field>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Field value</span>
      <span class="event-value">{{ multiForm.toppings().value().join(', ') || '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Valid</span>
      <span class="event-value">{{ multiForm.toppings().valid() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
