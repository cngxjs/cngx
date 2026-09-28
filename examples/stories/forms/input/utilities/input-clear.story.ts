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
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
    'import type { CngxFieldSkin } from \'@cngx/forms/field\';',
    'import { CngxAffixRow, CngxSuffix } from \'@cngx/forms/field\';',
    'import { CngxInput, CngxInputClear } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxAffixRow', 'CngxSuffix', 'CngxInput', 'CngxInputClear', 'CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly skin = signal<CngxFieldSkin>('outline');`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label" for="ic-name">Name</label>
      <span cngxAffixRow [skin]="skin()">
        <input id="ic-name" cngxInput [skin]="skin()" #nameInput placeholder="Type something..." class="demo-input" />
        <button type="button" cngxSuffix cngxSuffixInteractive [cngxInputClear]="nameInput" #clr="cngxInputClear"
          [disabled]="!clr.hasValue()">
          Clear
        </button>
      </span>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:8px">
    <div class="event-row" style="margin-top:8px">
      <cngx-radio-group [(value)]="skin" name="field-skin" label="Field skin">
        <cngx-radio value="outline">Outline</cngx-radio>
        <cngx-radio value="fill">Fill</cngx-radio>
        <cngx-radio value="bare">Bare</cngx-radio>
      </cngx-radio-group>
    </div>
  </div>`,
};
