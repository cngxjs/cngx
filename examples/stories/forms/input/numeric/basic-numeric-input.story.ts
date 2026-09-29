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
    'import { CngxFieldSkinHost } from \'@cngx/forms/field\';',
    'import { CngxNumericInput } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxNumericInput', 'CngxFieldSkinHost'],
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label" for="numeric-amount">Amount</label>
      <input id="numeric-amount" cngxNumericInput cngxFieldSkin #num="cngxNumericInput" class="demo-input" />
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Value: {{ num.numericValue() }}</span>
        <span class="status-badge">Valid: {{ num.isValid() }}</span>
      </div>`,
};
