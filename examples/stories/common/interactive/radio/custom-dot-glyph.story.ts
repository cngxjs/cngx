import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadio: Custom dot glyph',
  subtitle: 'Each <code>cngx-radio</code> forwards a <code>[dotGlyph]</code> input to the inner <code>cngx-radio-indicator</code>. Project a <code>TemplateRef&lt;void&gt;</code> to swap the default dot for a design-system glyph; the indicator host still owns the radio chrome and the checked-state aria.',
  description: 'CngxRadio renders a CngxRadioIndicator as its checked-state visual. The indicator accepts an optional [dotGlyph] TemplateRef so each leaf can paint its own checked glyph without touching the radio host or its aria-checked binding. Decorative glyphs MUST carry aria-hidden="true" because the radio host already carries role="radio" + aria-checked; the glyph is presentational and a screen reader would otherwise announce the character twice.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxRadioGroup',
    'CngxRadio',
  ],
  references: [
    { label: 'WAI-ARIA APG: Radio Group', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/' },
    { label: 'WCAG 1.1.1 Non-text Content', href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html' },
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);`,
  template: `
  <ng-template #starGlyph><span aria-hidden="true">★</span></ng-template>
  <ng-template #checkGlyph><span aria-hidden="true">✓</span></ng-template>
  <cngx-radio-group [(value)]="payment" name="payment-method-glyph" label="Payment method">
    <cngx-radio value="card" [dotGlyph]="starGlyph">Card</cngx-radio>
    <cngx-radio value="cash" [dotGlyph]="checkGlyph">Cash</cngx-radio>
    <cngx-radio value="invoice">Invoice (default dot)</cngx-radio>
  </cngx-radio-group>`,
};
