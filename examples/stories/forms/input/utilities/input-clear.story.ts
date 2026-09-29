import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputClear: input clear',
  subtitle: '<code>[cngxInputClear]</code> takes a reference to the target input. Exposes <code>hasValue()</code> signal and <code>clear()</code> method.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxInputClear',
  ],
  moduleImports: [
    'import { CngxFieldBox, CngxSuffix } from \'@cngx/forms/field\';',
    'import { CngxInput, CngxInputClear } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxFieldBox', 'CngxSuffix', 'CngxInput', 'CngxInputClear'],
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label" for="ic-name">Name</label>
      <span cngxFieldBox>
        <input id="ic-name" cngxInput #nameInput placeholder="Type something..." class="demo-input" />
        <button type="button" cngxSuffix cngxSuffixInteractive [cngxInputClear]="nameInput" #clr="cngxInputClear"
          [disabled]="!clr.hasValue()">
          Clear
        </button>
      </span>
    </div>
  </div>`,
};
