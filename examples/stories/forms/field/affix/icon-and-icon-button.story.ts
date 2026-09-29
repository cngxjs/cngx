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
  apiComponents: ['CngxPrefix', 'CngxSuffix', 'CngxFieldBox', 'CngxInputClear'],
  moduleImports: [
    'import { form, FormField } from \'@angular/forms/signals\';',
    'import { CngxIcon } from \'@cngx/common/display\';',
    'import { CngxFormField, CngxLabel, CngxFieldBox, CngxPrefix, CngxSuffix } from \'@cngx/forms/field\';',
    'import { CngxInput, CngxInputClear } from \'@cngx/forms/input\';',
  ],
  imports: [
    'CngxFormField',
    'CngxLabel',
    'CngxFieldBox',
    'CngxPrefix',
    'CngxSuffix',
    'CngxInput',
    'CngxInputClear',
    'CngxIcon',
    'FormField',
  ],
  references: [
    { label: 'WCAG 2.5.8 Target Size (Minimum)', href: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html' },
    { label: 'WCAG 4.1.2 Name, Role, Value', href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html' },
  ],
  setup: `private readonly model = signal({ query: '' });
  protected readonly searchForm = form(this.model);`,
  template: `  <div style="max-inline-size:24rem">
    <cngx-form-field [field]="searchForm.query" skin="fill">
      <label cngxLabel>Search people</label>
      <span cngxFieldBox>
        <span cngxPrefix>
          <cngx-icon>
            <svg viewBox="0 0 24 24" width="1em" height="1em">
              <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </cngx-icon>
        </span>
        <input cngxInput #query type="search" [formField]="searchForm.query" />
        <button type="button" cngxSuffix cngxSuffixInteractive [cngxInputClear]="query" #clr="cngxInputClear"
          [disabled]="!clr.hasValue()">
          <cngx-icon>
            <svg viewBox="0 0 24 24" width="1em" height="1em">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </cngx-icon>
        </button>
      </span>
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Query</span><span class="event-value">{{ searchForm.query().value() || '(empty)' }}</span></div>
  </div>`,
};
