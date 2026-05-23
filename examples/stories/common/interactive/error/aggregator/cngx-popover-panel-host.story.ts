import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorAggregator: cngx-popover-panel host',
  subtitle:
    'The aggregator binds to a popover-panel body. Click the trigger to open the popover; inside the panel, the aggregator rolls up its sources just like any other host.',
  description:
    '<code>cngxErrorAggregator</code> rolls up child <code>cngxErrorSource</code> directives into one live A11y surface. Derived signals (<code>hasError</code>, <code>errorCount</code>, <code>activeErrors</code>, <code>errorLabels</code>, <code>shouldShow</code>, <code>announcement</code>) carry structural <code>equal</code> fns so unrelated re-emissions do not cascade. The directive is template-free; render the SR live region yourself.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'error-handling'],
  apiComponents: ['CngxErrorAggregator', 'CngxErrorSource'],
  moduleImports: [
    "import { CngxErrorAggregator, CngxErrorSource } from '@cngx/common/interactive';",
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody } from '@cngx/common/popover';",
    "import { CngxLiveRegion } from '@cngx/common/a11y';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxErrorAggregator',
    'CngxErrorSource',
    'CngxLiveRegion',
  ],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-invalid',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-invalid',
    },
    {
      label: 'WAI-ARIA 1.2: aria-live',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live',
    },
  ],
  setup: `protected readonly billingDeclined = signal(true);`,
  template: `
  <button
    [cngxPopoverTrigger]="billingPanel.popover"
    (click)="billingPanel.popover.toggle()"
    type="button"
  >
    Billing status - {{ billingDeclined() ? 'has issue' : 'all good' }}
  </button>
  <cngx-popover-panel #billingPanel>
    <span cngxPopoverHeader>Billing</span>
    <div cngxPopoverBody cngxErrorAggregator #billing="cngxErrorAggregator">
      <span cngxErrorSource="declined" [when]="billingDeclined()" label="Last charge declined"></span>
      <p>Recent activity for this account.</p>
      @if (billing.shouldShow()) {
        <ul role="alert" class="demo-error-list">
          @for (label of billing.errorLabels(); track label) {
            <li>{{ label }}</li>
          }
        </ul>
      }
    </div>
  </cngx-popover-panel>
  <span class="cngx-sr-only" cngxLiveRegion>{{ billing.announcement() }}</span>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row"><span class="event-label">hasError()</span><span class="event-value">{{ billing.hasError() }}</span></div>
    <div class="event-row"><span class="event-label">errorCount()</span><span class="event-value">{{ billing.errorCount() }}</span></div>
    <div class="event-row"><span class="event-label">shouldShow()</span><span class="event-value">{{ billing.shouldShow() }}</span></div>
  </div>
  <div class="button-row" style="margin-top: 12px;">
    <button type="button" (click)="billingDeclined.set(!billingDeclined())">
      Toggle declined
    </button>
  </div>`,
};
