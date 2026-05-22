import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorAggregator: Mat-tab label with error-count badge',
  subtitle:
    'Each tab carries its own aggregator. The label slot reads <code>aggregator.errorCount()</code> to render a small circular badge. Toggle the chrome buttons to watch the badges flip in real time.',
  description:
    '<code>cngxErrorAggregator</code> rolls up child <code>cngxErrorSource</code> directives into one live A11y surface. Derived signals (<code>hasError</code>, <code>errorCount</code>, <code>activeErrors</code>, <code>errorLabels</code>, <code>shouldShow</code>, <code>announcement</code>) carry structural <code>equal</code> fns so unrelated re-emissions do not cascade. The directive is template-free; render the SR live region yourself.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'error-handling'],
  apiComponents: ['CngxErrorAggregator', 'CngxErrorSource'],
  moduleImports: [
    "import { CngxErrorAggregator, CngxErrorSource } from '@cngx/common/interactive';",
    "import { MatTabsModule } from '@angular/material/tabs';",
  ],
  imports: ['MatTabsModule', 'CngxErrorAggregator', 'CngxErrorSource'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-invalid',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-invalid',
    },
  ],
  setup: `protected readonly tabAddressIncomplete = signal(true);
  protected readonly tabPaymentInvalid = signal(true);`,
  template: `
  <mat-tab-group>
    <mat-tab>
      <ng-template mat-tab-label>
        Address
        @if (addressTab.errorCount() > 0) {
          <span aria-hidden="true" class="demo-error-count-badge">{{ addressTab.errorCount() }}</span>
        }
      </ng-template>
      <section
        style="margin-top: 1rem;"
        cngxErrorAggregator
        #addressTab="cngxErrorAggregator"
        class="demo-error-surface"
      >
        <span cngxErrorSource="address-incomplete" [when]="tabAddressIncomplete()" label="Street and city are required"></span>
        <p>Address form goes here.</p>
      </section>
    </mat-tab>
    <mat-tab>
      <ng-template mat-tab-label>
        Payment
        @if (paymentTab.errorCount() > 0) {
          <span aria-hidden="true" class="demo-error-count-badge">{{ paymentTab.errorCount() }}</span>
        }
      </ng-template>
      <section
        style="margin-top: 1rem;"
        cngxErrorAggregator
        #paymentTab="cngxErrorAggregator"
        class="demo-error-surface"
      >
        <span cngxErrorSource="payment-invalid" [when]="tabPaymentInvalid()" label="Card number invalid"></span>
        <p>Payment form goes here.</p>
      </section>
    </mat-tab>
  </mat-tab-group>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row"><span class="event-label">address errorCount()</span><span class="event-value">{{ addressTab.errorCount() }}</span></div>
    <div class="event-row"><span class="event-label">address shouldShow()</span><span class="event-value">{{ addressTab.shouldShow() }}</span></div>
    <div class="event-row"><span class="event-label">payment errorCount()</span><span class="event-value">{{ paymentTab.errorCount() }}</span></div>
    <div class="event-row"><span class="event-label">payment shouldShow()</span><span class="event-value">{{ paymentTab.shouldShow() }}</span></div>
  </div>
  <div class="button-row" style="margin-top: 12px;">
    <button type="button" (click)="tabAddressIncomplete.set(!tabAddressIncomplete())">Toggle address error</button>
    <button type="button" (click)="tabPaymentInvalid.set(!tabPaymentInvalid())">Toggle payment error</button>
  </div>`,
};
