import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPrefix / CngxSuffix: decorative icon and icon-button affixes',
  subtitle: 'A search field with a magnifier glyph before the value and a clear button after it. The glyph is decorative and stays out of the accessibility tree; the clear button is a real control with its own name, focus ring and touch target inside the skinned box.',
  description: 'A plain <code>cngxPrefix</code> is <code>aria-hidden</code>, so the glyph adds nothing a screen reader has to skip. <code>cngxSuffixInteractive</code> keeps the button in the tab order and the accessibility tree; <code>CngxInputClear</code> gives it the name "Clear" from the input config and returns focus to the input after clearing. The affix row is the box: switch the skin and prefix, value and suffix share one surface and one underline, while the button keeps its own focus ring and grows to the touch-target floor under a coarse pointer.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxPrefix', 'CngxSuffix', 'CngxAffixRow', 'CngxInputClear'],
  moduleImports: [
    'import { form, FormField } from \'@angular/forms/signals\';',
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
    'import { CngxIcon } from \'@cngx/common/display\';',
    'import type { CngxFieldSkin } from \'@cngx/forms/field\';',
    'import { CngxFormField, CngxLabel, CngxAffixRow, CngxPrefix, CngxSuffix } from \'@cngx/forms/field\';',
    'import { CngxInput, CngxInputClear } from \'@cngx/forms/input\';',
  ],
  imports: [
    'CngxFormField',
    'CngxLabel',
    'CngxAffixRow',
    'CngxPrefix',
    'CngxSuffix',
    'CngxInput',
    'CngxInputClear',
    'CngxIcon',
    'FormField',
    'CngxRadioGroup',
    'CngxRadio',
  ],
  references: [
    { label: 'WCAG 2.5.8 Target Size (Minimum)', href: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html' },
    { label: 'WCAG 4.1.2 Name, Role, Value', href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html' },
  ],
  setup: `private readonly model = signal({ query: '' });
  protected readonly searchForm = form(this.model);
  protected readonly skin = signal<CngxFieldSkin>('fill');`,
  template: `  <div style="max-inline-size:24rem">
    <cngx-form-field [field]="searchForm.query" [skin]="skin()">
      <label cngxLabel>Search people</label>
      <span cngxAffixRow>
        <span cngxPrefix>
          <cngx-icon>
            <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </cngx-icon>
        </span>
        <input cngxInput #query type="search" [formField]="searchForm.query" />
        <button type="button" cngxSuffix cngxSuffixInteractive [cngxInputClear]="query" #clr="cngxInputClear"
          [disabled]="!clr.hasValue()">
          <cngx-icon>
            <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </cngx-icon>
        </button>
      </span>
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Query</span><span class="event-value">{{ searchForm.query().value() || '(empty)' }}</span></div>
    <div class="event-row" style="margin-top:8px">
      <cngx-radio-group [(value)]="skin" name="field-skin" label="Field skin">
        <cngx-radio value="outline">Outline</cngx-radio>
        <cngx-radio value="fill">Fill</cngx-radio>
        <cngx-radio value="bare">Bare</cngx-radio>
      </cngx-radio-group>
    </div>
  </div>`,
};
