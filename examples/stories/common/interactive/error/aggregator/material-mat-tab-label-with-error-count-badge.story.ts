import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Material mat-tab label with error-count badge',
  subtitle: 'Each tab carries its own aggregator. The label slot reads <code>aggregator.errorCount()</code> to render a red circular badge. Toggle the buttons to watch the badges flip in real time.',
  description: '<code>cngxErrorAggregator</code> rolls up child <code>cngxErrorSource</code> directives into one live A11y surface. Derived signals (<code>hasError</code>, <code>errorCount</code>, <code>activeErrors</code>, <code>errorLabels</code>, <code>shouldShow</code>, <code>announcement</code>) all carry structural <code>equal</code> fns so unrelated re-emissions do not cascade. The directive is template-free — render the SR live region yourself. Each section below shows the reactive state at the top so the consumer sees every signal toggle live.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'error-handling'],
  apiComponents: [
    'CngxErrorAggregator',
    'CngxErrorScope',
    'CngxErrorSource',
  ],
  moduleImports: [
    'import { CngxErrorAggregator, CngxErrorSource } from \'@cngx/common/interactive\';',
    'import { MatTabsModule } from \'@angular/material/tabs\';',
  ],
  imports: ['MatTabsModule', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly tabAddressIncomplete = signal(true);
  protected readonly tabPaymentInvalid = signal(true);`,
  template: `
  <mat-tab-group>
    <mat-tab>
      <ng-template mat-tab-label>
        Address
        @if (addressTab.errorCount() > 0) {
          <span aria-hidden="true" style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; margin-inline-start: 6px; border-radius: 9px; background: #b00020; color: white; font-size: 0.75em; line-height: 1;">{{ addressTab.errorCount() }}</span>
        }
      </ng-template>
      <section
        cngxErrorAggregator
        #addressTab="cngxErrorAggregator"
        [style.background]="addressTab.shouldShow() ? 'rgba(176, 0, 32, 0.04)' : 'transparent'"
        style="padding: 16px;"
      >
        <span cngxErrorSource="address-incomplete" [when]="tabAddressIncomplete()" label="Street and city are required"></span>
        <p>Address form goes here.</p>
        <pre style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 0.85em;">errorCount: {{ addressTab.errorCount() }}, shouldShow: {{ addressTab.shouldShow() }}</pre>
        <button type="button" (click)="tabAddressIncomplete.set(!tabAddressIncomplete())">Toggle address error</button>
      </section>
    </mat-tab>
    <mat-tab>
      <ng-template mat-tab-label>
        Payment
        @if (paymentTab.errorCount() > 0) {
          <span aria-hidden="true" style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; margin-inline-start: 6px; border-radius: 9px; background: #b00020; color: white; font-size: 0.75em; line-height: 1;">{{ paymentTab.errorCount() }}</span>
        }
      </ng-template>
      <section
        cngxErrorAggregator
        #paymentTab="cngxErrorAggregator"
        [style.background]="paymentTab.shouldShow() ? 'rgba(176, 0, 32, 0.04)' : 'transparent'"
        style="padding: 16px;"
      >
        <span cngxErrorSource="payment-invalid" [when]="tabPaymentInvalid()" label="Card number invalid"></span>
        <p>Payment form goes here.</p>
        <pre style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 0.85em;">errorCount: {{ paymentTab.errorCount() }}, shouldShow: {{ paymentTab.shouldShow() }}</pre>
        <button type="button" (click)="tabPaymentInvalid.set(!tabPaymentInvalid())">Toggle payment error</button>
      </section>
    </mat-tab>
  </mat-tab-group>`,
};
