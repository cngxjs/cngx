import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Input Format',
  subtitle: '<code>[cngxInputFormat]</code> formats on blur (display) and parses on focus (edit). Reactive forms receive the raw value.',
  description: 'Small headless behaviors: clear button, clipboard copy, and display formatting.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxInputClear',
    'CngxCopyValue',
    'CngxInputFormat',
  ],
  moduleImports: [
    'import { CngxInputFormat } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxInputFormat'],
  setup: `protected readonly formatCurrency = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };
  protected readonly parseCurrency = (v: string) => v.replace(/[^0-9.\\-]/g, '');`,
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Amount (formatted as USD on blur)</label>
      <input [cngxInputFormat]="formatCurrency" [parse]="parseCurrency"
        #fmt="cngxInputFormat" placeholder="Enter amount..." class="demo-input" />
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Raw: {{ fmt.rawValue() }}</span>
        <span class="status-badge">Display: {{ fmt.displayValue() }}</span>
      </div>`,
};
