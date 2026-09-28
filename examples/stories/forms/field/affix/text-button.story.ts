import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSuffix: text-button affix',
  subtitle: 'A coupon-code field with an "Apply" button inside the field box. The button is a real <code>type="button"</code> control marked <code>cngxSuffixInteractive</code>, and it stays disabled until there is a code to apply.',
  description: 'A disabled control has to say why. The reason lives in a visually hidden element that is always in the DOM; the button references it through <code>aria-describedby</code> only while it is disabled, so the reference never points at a sentence that no longer applies. A text button reads better than an icon when the action is a verb the user has to confirm. It keeps its own focus ring and the touch-target floor inside the affix row.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxSuffix', 'CngxFieldBox', 'CngxFormField'],
  moduleImports: [
    'import { form, FormField } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldBox, CngxSuffix } from \'@cngx/forms/field\';',
    'import { CngxInput } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldBox', 'CngxSuffix', 'CngxInput', 'FormField'],
  references: [
    { label: 'WCAG 4.1.2 Name, Role, Value', href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html' },
  ],
  setup: `private readonly model = signal({ coupon: '' });
  protected readonly checkoutForm = form(this.model);
  protected readonly isEmpty = computed(() => this.checkoutForm.coupon().value().trim() === '');
  protected readonly appliedCode = signal<string | null>(null);
  protected handleApply(): void {
    this.appliedCode.set(this.checkoutForm.coupon().value().trim());
  }`,
  template: `  <div style="max-inline-size:24rem">
    <cngx-form-field [field]="checkoutForm.coupon" skin="fill">
      <label cngxLabel>Coupon code</label>
      <span cngxFieldBox>
        <input cngxInput [formField]="checkoutForm.coupon" autocomplete="off" />
        <button type="button" cngxSuffix cngxSuffixInteractive
          [disabled]="isEmpty()"
          [attr.aria-describedby]="isEmpty() ? 'coupon-apply-reason' : null"
          (click)="handleApply()">
          Apply
        </button>
      </span>
    </cngx-form-field>
    <span id="coupon-apply-reason" class="cngx-sr-only">Enter a coupon code to apply it.</span>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:12px">
      <span class="status-badge">Applied: {{ appliedCode() ?? 'none' }}</span>
    </div>`,
};
