import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled — group cascades, per-radio overrides',
  subtitle: 'Group <code>[disabled]</code> cascades to every leaf via <code>radioDisabled = computed(() => group.disabled() || disabled())</code>. Per-radio <code>[disabled]</code> blocks only that leaf and is skipped by roving navigation.',
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
  protected readonly groupDisabled = signal(false);`,
  template: `
  <button type="button" (click)="groupDisabled.set(!groupDisabled())" class="sort-btn">
    {{ groupDisabled() ? 'Enable group' : 'Disable group' }}
  </button>
  <cngx-radio-group [(value)]="payment" [disabled]="groupDisabled()" name="payment-method-d">
    <cngx-radio value="card">Card</cngx-radio>
    <cngx-radio value="cash">Cash (per-radio disabled)</cngx-radio>
    <cngx-radio value="invoice" [disabled]="true">Invoice (per-radio disabled)</cngx-radio>
  </cngx-radio-group>`,
  css: `.sort-btn { margin-bottom: 16px; }`,
};
