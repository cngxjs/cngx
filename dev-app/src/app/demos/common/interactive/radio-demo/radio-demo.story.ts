import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Radio group',
  navLabel: 'Radio group',
  navCategory: 'interactive',
  description:
    'Single-select radio-group molecule and its CngxRadio leaves. Group provides ' +
    'CNGX_RADIO_GROUP for parent-child contract (never injects the concrete class) ' +
    'and CngxRovingTabindex as host directive for arrow-key focus movement. ' +
    'Auto-select-on-arrow is wired via a transient pendingArrowSelect flag — Tab-into-group ' +
    'does NOT auto-select; only an arrow keydown followed by focus moves the value.',
  apiComponents: ['CngxRadioGroup', 'CngxRadio', 'CNGX_RADIO_GROUP'],
  moduleImports: ["import { CngxRadioGroup, CngxRadio } from '@cngx/common/interactive';"],
  setup: `
  protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);
  protected readonly orientation = signal<'horizontal' | 'vertical'>('vertical');
  protected readonly groupDisabled = signal(false);
  `,
  sections: [
    {
      title: 'Basic — vertical group',
      subtitle:
        'Tab into the group (lands on the active radio, or the first one if none selected). ' +
        '<strong>ArrowDown</strong>/<strong>ArrowRight</strong> move focus AND select the next radio; ' +
        '<strong>ArrowUp</strong>/<strong>ArrowLeft</strong> the previous. ' +
        '<strong>Space</strong>/<strong>Enter</strong> select the focused radio (idempotent).',
      imports: ['CngxRadioGroup', 'CngxRadio'],
      template: `
  <cngx-radio-group [(value)]="payment" name="payment-method">
    <cngx-radio value="card">Credit card</cngx-radio>
    <cngx-radio value="cash">Cash on delivery</cngx-radio>
    <cngx-radio value="invoice">Invoice</cngx-radio>
  </cngx-radio-group>
  <p class="caption">Bound: <code>{{ payment() ?? '(none)' }}</code></p>`,
      css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 12px; }`,
    },
    {
      title: 'Orientation — horizontal',
      subtitle:
        '<code>[orientation]="\'horizontal\'"</code> flips the layout AND tells the host roving directive ' +
        'to use ArrowLeft/ArrowRight for navigation.',
      imports: ['CngxRadioGroup', 'CngxRadio'],
      template: `
  <cngx-radio-group [(value)]="payment" orientation="horizontal" name="payment-method-h">
    <cngx-radio value="card">Card</cngx-radio>
    <cngx-radio value="cash">Cash</cngx-radio>
    <cngx-radio value="invoice">Invoice</cngx-radio>
  </cngx-radio-group>`,
    },
    {
      title: 'Disabled — group cascades, per-radio overrides',
      subtitle:
        'Group <code>[disabled]</code> cascades to every leaf via <code>radioDisabled = computed(() => group.disabled() || disabled())</code>. ' +
        'Per-radio <code>[disabled]</code> blocks only that leaf and is skipped by roving navigation.',
      imports: ['CngxRadioGroup', 'CngxRadio'],
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
    },
    {
      title: 'Custom dot glyph',
      subtitle:
        'Each <code>cngx-radio</code> forwards a <code>[dotGlyph]</code> input to the inner ' +
        '<code>cngx-radio-indicator</code>. Project a <code>TemplateRef&lt;void&gt;</code> to ' +
        'replace the default dot — useful for design-system glyphs or branded icons.',
      imports: ['CngxRadioGroup', 'CngxRadio'],
      template: `
  <ng-template #starGlyph><span aria-hidden="true">★</span></ng-template>
  <ng-template #checkGlyph><span aria-hidden="true">✓</span></ng-template>
  <cngx-radio-group [(value)]="payment" name="payment-method-glyph">
    <cngx-radio value="card" [dotGlyph]="starGlyph">Card</cngx-radio>
    <cngx-radio value="cash" [dotGlyph]="checkGlyph">Cash</cngx-radio>
    <cngx-radio value="invoice">Invoice (default dot)</cngx-radio>
  </cngx-radio-group>`,
    },
  ],
};
