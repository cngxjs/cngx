import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Numeric Input',
  navLabel: 'Numeric',
  navCategory: 'input',
  description:
    'Locale-aware numeric input with Intl.NumberFormat formatting, arrow key increment/decrement, min/max clamping, and decimal control.',
  apiComponents: ['CngxNumericInput'],
  overview:
    '<p><code>CngxNumericInput</code> keeps <code>type="text"</code> (no browser spinners) ' +
    'and uses <code>Intl.NumberFormat</code> for locale-aware formatting on blur.</p>' +
    '<p>Arrow Up/Down increments by <code>step</code>, Shift+Arrow by <code>step * 10</code>. ' +
    'Implements <code>ControlValueAccessor</code> — the form control receives a <code>number | null</code>.</p>',
  moduleImports: [
    "import { CngxNumericInput } from '@cngx/forms/input';",
  ],
  sections: [
    {
      title: 'Basic Numeric Input',
      subtitle:
        'Type digits, use Arrow Up/Down to increment. Shift+Arrow for x10. ' +
        'Value is formatted with thousands separator on blur.',
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
    },
    {
      title: 'Min / Max / Step / Decimals',
      subtitle:
        'Constrain values with <code>[min]</code>, <code>[max]</code>. Control decimal places with <code>[decimals]</code>. ' +
        'Arrow keys use <code>[step]</code>.',
      imports: ['CngxNumericInput'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Percentage (0-100, step 5)</label>
      <input cngxNumericInput [min]="0" [max]="100" [step]="5" [decimals]="0"
        #pct="cngxNumericInput" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">{{ pct.numericValue() ?? '-' }}%</span>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">Price (2 decimals, step 0.50)</label>
      <input cngxNumericInput [min]="0" [step]="0.5" [decimals]="2"
        #price="cngxNumericInput" class="demo-input" />
      <div class="status-row">
        <span class="status-badge">{{ price.numericValue() }}</span>
      </div>
    </div>
    <div class="demo-field">
      <label class="demo-label">Temperature (-40 to 60)</label>
      <input cngxNumericInput [min]="-40" [max]="60" [step]="1" [decimals]="1"
        #temp="cngxNumericInput" class="demo-input" />
    </div>
  </div>`,
    },
    {
      title: 'Locale Formatting',
      subtitle:
        'Pass <code>[locale]</code> to use a specific locale. German uses <code>.</code> as thousands separator and <code>,</code> for decimals.',
      imports: ['CngxNumericInput'],
      setup: `
  protected handleSetValue(dir: CngxNumericInput): void {
    dir.setValue(1234567.89);
  }
  `,
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">English (en-US)</label>
      <input cngxNumericInput locale="en-US" [decimals]="2"
        #enNum="cngxNumericInput" class="demo-input" />
      <button class="chip" (click)="handleSetValue(enNum)">Set 1,234,567.89</button>
    </div>
    <div class="demo-field">
      <label class="demo-label">German (de-DE)</label>
      <input cngxNumericInput locale="de-DE" [decimals]="2"
        #deNum="cngxNumericInput" class="demo-input" />
      <button class="chip" (click)="handleSetValue(deNum)">Set 1.234.567,89</button>
    </div>
    <div class="demo-field">
      <label class="demo-label">Swiss (de-CH)</label>
      <input cngxNumericInput locale="de-CH" [decimals]="2"
        #chNum="cngxNumericInput" class="demo-input" />
      <button class="chip" (click)="handleSetValue(chNum)">Set 1'234'567.89</button>
    </div>
  </div>`,
    },
  ],
};
