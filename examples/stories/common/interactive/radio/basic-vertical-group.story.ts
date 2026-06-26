import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioGroup: Basic vertical group',
  subtitle: 'Tab into the group lands on the active radio (or the first one if none is selected). <strong>ArrowDown</strong>/<strong>ArrowRight</strong> move focus AND select the next radio; <strong>ArrowUp</strong>/<strong>ArrowLeft</strong> the previous. <strong>Space</strong>/<strong>Enter</strong> select the focused radio (idempotent).',
  description: 'Default vertical radio group with the auto-select-on-arrow keyboard model. Tab enters the group; subsequent Arrow / Home / End move focus AND commit the value - the first arrow press already selects the newly-focused radio. The plain Tab-into-group path does not auto-select, so refocusing the group never silently overwrites the consumer-bound value.',
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
    { label: 'WCAG 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);`,
  templateChromeBefore: `
  <div class="demo-kbd-hint">
    <span><kbd>Tab</kbd> enter / leave group</span>
    <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> / <kbd>&larr;</kbd><kbd>&rarr;</kbd> navigate + select</span>
    <span><kbd>Home</kbd> / <kbd>End</kbd> first / last</span>
    <span><kbd>Space</kbd> / <kbd>Enter</kbd> select focused</span>
  </div>`,
  template: `
  <cngx-radio-group [(value)]="payment" name="payment-method" label="Payment method">
    <cngx-radio value="card">Credit card</cngx-radio>
    <cngx-radio value="cash">Cash on delivery</cngx-radio>
    <cngx-radio value="invoice">Invoice</cngx-radio>
  </cngx-radio-group>
  <p class="demo-radio-bound">Bound: <code>{{ payment() ?? '(none)' }}</code></p>`,
};
