import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioGroup: Disabled cascade with per-radio overrides',
  subtitle: 'Group <code>[disabled]</code> cascades to every leaf via <code>radioDisabled = computed(() =&gt; group.disabled() || disabled())</code>. Per-radio <code>[disabled]</code> blocks only that leaf and is skipped by roving navigation.',
  description: 'Two disabled axes meet in one group. Group-level [disabled] short-circuits every selection pathway (click, Space, Enter, auto-select on arrow) but does NOT remove leaves from the roving sequence - focus still transits them so a screen-reader user can read the labels and understand why the choices are unavailable. Per-radio [disabled] is forwarded into the host CngxRovingItem, so disabled leaves drop OUT of the roving sequence entirely (arrow keys skip them).',
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
    { label: 'WCAG 2.4.3 Focus Order', href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html' },
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);
  protected readonly groupDisabled = signal<boolean>(false);`,
  template: `
  <cngx-radio-group [(value)]="payment" [disabled]="groupDisabled()" name="payment-method-d" label="Payment method">
    <cngx-radio value="card">Card</cngx-radio>
    <cngx-radio value="cash">Cash</cngx-radio>
    <cngx-radio value="invoice" [disabled]="true">Invoice (per-radio disabled)</cngx-radio>
  </cngx-radio-group>`,
  templateChrome: `
  <div class="button-row" style="margin-bottom:16px">
    <button type="button" (click)="groupDisabled.set(!groupDisabled())">
      {{ groupDisabled() ? 'Enable group' : 'Disable group' }}
    </button>
  </div>`,
};
