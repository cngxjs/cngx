import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — vertical group',
  subtitle: 'Tab into the group (lands on the active radio, or the first one if none selected). <strong>ArrowDown</strong>/<strong>ArrowRight</strong> move focus AND select the next radio; <strong>ArrowUp</strong>/<strong>ArrowLeft</strong> the previous. <strong>Space</strong>/<strong>Enter</strong> select the focused radio (idempotent).',
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
  <cngx-radio-group [(value)]="payment" name="payment-method">
    <cngx-radio value="card">Credit card</cngx-radio>
    <cngx-radio value="cash">Cash on delivery</cngx-radio>
    <cngx-radio value="invoice">Invoice</cngx-radio>
  </cngx-radio-group>
  <p class="caption">Bound: <code>{{ payment() ?? '(none)' }}</code></p>`,
  css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 12px; }`,
};
