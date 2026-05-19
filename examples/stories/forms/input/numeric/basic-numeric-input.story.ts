import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic Numeric Input',
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
    'import { CngxNumericInput } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxNumericInput'],
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Amount</label>
      <input cngxNumericInput #num="cngxNumericInput" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">Value: {{ num.numericValue() }}</span>
        <span class="status-badge">Valid: {{ num.isValid() }}</span>
      </div>
    </div>
  </div>`,
};
