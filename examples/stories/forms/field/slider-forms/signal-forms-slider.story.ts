import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSliderFieldBridge: signal forms',
  subtitle:
    '<code>cngxSliderFieldBridge</code> drops a <code>&lt;cngx-slider&gt;</code> into <code>&lt;cngx-form-field&gt;</code> and two-way-syncs its value with the bound field - no explicit value binding on the slider.',
  description:
    'The slider atom stays Forms-agnostic; the bridge provides <code>CNGX_FORM_FIELD_CONTROL</code> so the presenter wires the label, ARIA, and value sync. Move the slider and the field value follows; mutate the field and the slider follows.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxSliderFieldBridge', 'CngxSlider', 'CngxFormField'],
  moduleImports: [
    "import { form } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxSliderFieldBridge } from '@cngx/forms/field';",
    "import { CngxSlider } from '@cngx/common/interactive';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxSlider', 'CngxSliderFieldBridge'],
  setup: `private readonly model = signal<{ volume: number }>({ volume: 30 });
  protected readonly volumeForm = form(this.model);`,
  template: `  <cngx-form-field [field]="volumeForm.volume">
    <label cngxLabel>Volume</label>
    <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" [step]="5" />
  </cngx-form-field>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Field value</span>
      <span class="event-value">{{ volumeForm.volume().value() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Touched</span>
      <span class="event-value">{{ volumeForm.volume().touched() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
