import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioGroup: Horizontal orientation',
  subtitle: '<code>[orientation]="\'horizontal\'"</code> flips the visual flex direction AND retunes the host CngxRovingTabindex to consume ArrowLeft/ArrowRight as the primary navigation axis.',
  description: 'Setting orientation to horizontal forwards the value into the host CngxRovingTabindex via inputs: [\'orientation\'] on the host-directive declaration; the roving directive then swaps its primary axis from ArrowUp/Down to ArrowLeft/Right while keeping Home / End and the auto-select-on-arrow contract intact. The host also gets aria-orientation="horizontal" so AT can announce the layout.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxRadioGroup',
    'CngxRadio',
  ],
  references: [
    { label: 'WAI-ARIA APG: Radio Group', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/' },
    { label: 'ARIA 1.2: aria-orientation', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-orientation' },
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);`,
  template: `
  <cngx-radio-group [(value)]="payment" orientation="horizontal" name="payment-method-h" label="Payment method">
    <cngx-radio value="card">Card</cngx-radio>
    <cngx-radio value="cash">Cash</cngx-radio>
    <cngx-radio value="invoice">Invoice</cngx-radio>
  </cngx-radio-group>`,
};
