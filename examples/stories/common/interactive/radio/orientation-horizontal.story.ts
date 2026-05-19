import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Orientation — horizontal',
  subtitle: '<code>[orientation]="\'horizontal\'"</code> flips the layout AND tells the host roving directive to use ArrowLeft/ArrowRight for navigation.',
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
  setup: `protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);
  protected readonly orientation = signal<'horizontal' | 'vertical'>('vertical');`,
  template: `
  <cngx-radio-group [(value)]="payment" orientation="horizontal" name="payment-method-h">
    <cngx-radio value="card">Card</cngx-radio>
    <cngx-radio value="cash">Cash</cngx-radio>
    <cngx-radio value="invoice">Invoice</cngx-radio>
  </cngx-radio-group>`,
};
