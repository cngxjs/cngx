import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'cngx-popover-panel host',
  subtitle: 'The aggregator binds to a popover-panel body. Click the trigger to open the popover; inside the panel, the aggregator rolls up its sources just like any other host.',
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
    'import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody } from \'@cngx/common/popover\';',
  ],
  imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly billingDeclined = signal(true);`,
  template: `
  <button
    [cngxPopoverTrigger]="billingPanel.popover"
    (click)="billingPanel.popover.toggle()"
    type="button"
  >
    Billing status — {{ billingDeclined() ? 'has issue' : 'all good' }}
  </button>
  <button type="button" (click)="billingDeclined.set(!billingDeclined())" style="margin-inline-start: 8px;">
    Toggle declined
  </button>
  <cngx-popover-panel #billingPanel>
    <span cngxPopoverHeader>Billing</span>
    <div cngxPopoverBody cngxErrorAggregator #billing="cngxErrorAggregator">
      <span cngxErrorSource="declined" [when]="billingDeclined()" label="Last charge declined"></span>
      <p>Recent activity for this account.</p>
      <pre style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 0.85em;">hasError    : {{ billing.hasError() }}
errorCount  : {{ billing.errorCount() }}
shouldShow  : {{ billing.shouldShow() }}</pre>
      @if (billing.hasError()) {
        <ul style="color: #b00020; margin: 8px 0; padding-inline-start: 24px;">
          @for (label of billing.errorLabels(); track label) {
            <li>{{ label }}</li>
          }
        </ul>
      }
    </div>
  </cngx-popover-panel>`,
};
