import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNumericInput: locale formatting',
  subtitle: 'Pass <code>[locale]</code> to use a specific locale. German uses <code>.</code> as thousands separator and <code>,</code> for decimals.',
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
  setup: `protected handleSetValue(dir: CngxNumericInput): void {
    dir.setValue(1234567.89);
  }`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">English (en-US)</label>
      <input cngxNumericInput locale="en-US" [decimals]="2"
        #enNum="cngxNumericInput" class="demo-input" />
      <button type="button" class="chip" (click)="handleSetValue(enNum)">Set 1,234,567.89</button>
    </div>
    <div class="demo-field">
      <label class="demo-label">German (de-DE)</label>
      <input cngxNumericInput locale="de-DE" [decimals]="2"
        #deNum="cngxNumericInput" class="demo-input" />
      <button type="button" class="chip" (click)="handleSetValue(deNum)">Set 1.234.567,89</button>
    </div>
    <div class="demo-field">
      <label class="demo-label">Swiss (de-CH)</label>
      <input cngxNumericInput locale="de-CH" [decimals]="2"
        #chNum="cngxNumericInput" class="demo-input" />
      <button type="button" class="chip" (click)="handleSetValue(chNum)">Set 1'234'567.89</button>
    </div>
  </div>`,
};
