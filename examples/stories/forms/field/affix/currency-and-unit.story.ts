import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPrefix / CngxSuffix: currency and unit affixes',
  subtitle:
    'Typed affix directives positioned around a numeric input you compose. <code>CngxPrefix</code> renders the <code>CHF</code> symbol before the value, <code>CngxSuffix</code> the <code>/ month</code> unit after; both are decorative so they are <code>aria-hidden</code> and a screen reader hears only the label and number. <code>withCurrency</code> formats the value (grouping + 2 decimals) with the symbol kept out of the editable text.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxPrefix', 'CngxSuffix', 'CngxFieldBox', 'CngxNumericInput'],
  moduleImports: [
    "import { CngxRadioGroup, CngxRadio } from '@cngx/common/interactive';",
    "import { CngxNumericInput, provideInputConfig, withCurrency } from '@cngx/forms/input';",
    "import type { CngxFieldSkin } from '@cngx/forms/field';",
    "import { CngxPrefix, CngxSuffix, CngxFieldBox } from '@cngx/forms/field';",
  ],
  imports: ['CngxNumericInput', 'CngxPrefix', 'CngxSuffix', 'CngxFieldBox', 'CngxRadioGroup', 'CngxRadio'],
  viewProviders: ["provideInputConfig(withCurrency({ code: 'CHF', locale: 'de-CH' }))"],
  setup: `protected readonly skin = signal<CngxFieldSkin>('outline');`,
  template: `  <div class="demo-field" style="max-inline-size:24rem">
    <label class="demo-label" for="affix-price">Monthly price</label>
    <span cngxFieldBox [skin]="skin()">
      <span cngxPrefix>CHF</span>
      <input id="affix-price" cngxNumericInput #num="cngxNumericInput" class="demo-input" />
      <span cngxSuffix>/ month</span>
    </span>
  </div>`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">Value: {{ num.value() }}</span>
    </div>
    <div class="event-row" style="margin-top:8px">
      <cngx-radio-group [(value)]="skin" name="field-skin" label="Field skin">
        <cngx-radio value="outline">Outline</cngx-radio>
        <cngx-radio value="fill">Fill</cngx-radio>
        <cngx-radio value="bare">Bare</cngx-radio>
      </cngx-radio-group>
    </div>`,
};
