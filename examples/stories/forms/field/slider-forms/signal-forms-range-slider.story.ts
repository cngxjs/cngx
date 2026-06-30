import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRangeSliderFieldBridge: signal forms',
  subtitle:
    '<code>cngxRangeSliderFieldBridge</code> drops a <code>&lt;cngx-range-slider&gt;</code> into <code>&lt;cngx-form-field&gt;</code> and two-way-syncs its <code>[number, number]</code> tuple with the bound field.',
  description:
    'The range slider atom stays Forms-agnostic; the bridge provides <code>CNGX_FORM_FIELD_CONTROL</code> and syncs the tuple. Drag either thumb and the field tuple follows; mutate the field and both thumbs follow.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxRangeSliderFieldBridge', 'CngxRangeSlider', 'CngxFormField'],
  moduleImports: [
    "import { form } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxRangeSliderFieldBridge } from '@cngx/forms/field';",
    "import { CngxRangeSlider } from '@cngx/common/interactive';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxRangeSlider', 'CngxRangeSliderFieldBridge'],
  setup: `private readonly model = signal<{ price: [number, number] }>({ price: [200, 800] });
  protected readonly priceForm = form(this.model);`,
  template: `  <cngx-form-field [field]="priceForm.price">
    <label cngxLabel>Price range</label>
    <cngx-range-slider cngxRangeSliderFieldBridge [min]="0" [max]="1000" [step]="10" />
  </cngx-form-field>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Field value</span>
      <span class="event-value">{{ priceForm.price().value()[0] }} - {{ priceForm.price().value()[1] }}</span>
    </div>
  </div>`,
};
