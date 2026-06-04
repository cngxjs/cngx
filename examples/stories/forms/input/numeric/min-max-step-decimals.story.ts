import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNumericInput: min max step decimals',
  subtitle: 'Constrain values with <code>[min]</code>, <code>[max]</code>. Control decimal places with <code>[decimals]</code>. Arrow keys use <code>[step]</code>.',
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
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Percentage (0-100, step 5)</label>
      <input cngxNumericInput [min]="0" [max]="100" [step]="5" [decimals]="0"
        #pct="cngxNumericInput" class="demo-input" />
      
    </div>
    <div class="demo-field">
      <label class="demo-label">Price (2 decimals, step 0.50)</label>
      <input cngxNumericInput [min]="0" [step]="0.5" [decimals]="2"
        #price="cngxNumericInput" class="demo-input" />
      
    </div>
    <div class="demo-field">
      <label class="demo-label">Temperature (-40 to 60)</label>
      <input cngxNumericInput [min]="-40" [max]="60" [step]="1" [decimals]="1"
        #temp="cngxNumericInput" class="demo-input" />
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">{{ pct.numericValue() ?? '-' }}%</span>
      </div>
<div class="status-row">
        <span class="status-badge">{{ price.numericValue() }}</span>
      </div>`,
};
