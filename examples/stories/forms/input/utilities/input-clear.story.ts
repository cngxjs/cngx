import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Input Clear',
  subtitle: '<code>[cngxInputClear]</code> takes a reference to the target input. Exposes <code>hasValue()</code> signal and <code>clear()</code> method.',
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
    'import { CngxInputClear } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxInputClear'],
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Name</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input #nameInput placeholder="Type something..." class="demo-input" style="flex:1" />
        <button [cngxInputClear]="nameInput" #clr="cngxInputClear"
          class="chip" [style.opacity]="clr.hasValue() ? 1 : 0.3">
          Clear
        </button>
      </div>
    </div>
  </div>`,
};
