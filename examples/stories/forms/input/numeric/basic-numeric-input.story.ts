import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNumericInput: basic numeric input',
  subtitle: 'Type digits, use Arrow Up/Down to increment. Shift+Arrow for x10. Value is formatted with thousands separator on blur.',
  description: 'Locale-aware numeric input with Intl.NumberFormat formatting, arrow key increment/decrement, min/max clamping, and decimal control.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxNumericInput',
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
    'import { CngxFieldSkinHost, type CngxFieldSkin } from \'@cngx/forms/field\';',
    'import { CngxNumericInput } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxNumericInput', 'CngxFieldSkinHost', 'CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly skin = signal<CngxFieldSkin>('outline');`,
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label" for="numeric-amount">Amount</label>
      <input id="numeric-amount" cngxNumericInput [cngxFieldSkin]="skin()" #num="cngxNumericInput" class="demo-input" />
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Value: {{ num.numericValue() }}</span>
        <span class="status-badge">Valid: {{ num.isValid() }}</span>
      </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row" style="margin-top:8px">
      <cngx-radio-group [(value)]="skin" name="field-skin" label="Field skin">
        <cngx-radio value="outline">Outline</cngx-radio>
        <cngx-radio value="fill">Fill</cngx-radio>
        <cngx-radio value="bare">Bare</cngx-radio>
      </cngx-radio-group>
    </div>
  </div>`,
};
