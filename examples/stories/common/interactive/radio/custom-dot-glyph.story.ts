import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom dot glyph',
  subtitle: 'Each <code>cngx-radio</code> forwards a <code>[dotGlyph]</code> input to the inner <code>cngx-radio-indicator</code>. Project a <code>TemplateRef&lt;void&gt;</code> to replace the default dot — useful for design-system glyphs or branded icons.',
  description: 'Single-select radio-group molecule and its CngxRadio leaves. Group provides CNGX_RADIO_GROUP for parent-child contract (never injects the concrete class) and CngxRovingTabindex as host directive for arrow-key focus movement. Auto-select-on-arrow is wired via a transient pendingArrowSelect flag — Tab-into-group does NOT auto-select; only an arrow keydown followed by focus moves the value.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxRadioGroup',
    'CngxRadio',
    'CNGX_RADIO_GROUP',
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);`,
  template: `
  <ng-template #starGlyph><span aria-hidden="true">★</span></ng-template>
  <ng-template #checkGlyph><span aria-hidden="true">✓</span></ng-template>
  <cngx-radio-group [(value)]="payment" name="payment-method-glyph">
    <cngx-radio value="card" [dotGlyph]="starGlyph">Card</cngx-radio>
    <cngx-radio value="cash" [dotGlyph]="checkGlyph">Cash</cngx-radio>
    <cngx-radio value="invoice">Invoice (default dot)</cngx-radio>
  </cngx-radio-group>`,
};
