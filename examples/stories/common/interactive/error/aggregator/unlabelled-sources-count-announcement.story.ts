import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorAggregator: Unlabelled sources speak the count',
  subtitle:
    'Sources without a <code>label</code> still speak: the aggregator announces the error count. <code>[errorCountAnnouncement]</code> sets that text per instance; without it the copy comes from <code>CNGX_INTERACTIVE_I18N</code> (<code>1 error</code> / <code>2 errors</code>).',
  description:
    'When no active <code>cngxErrorSource</code> carries a label, <code>announcement()</code> falls back to a count message instead of staying empty. The bound <code>[errorCountAnnouncement]</code> is a <code>(count) =&gt; string</code> formatter and wins over the <code>CNGX_INTERACTIVE_I18N</code> default. As soon as one active source has a label, the labels are spoken instead. <code>injectErrorAggregator</code> takes the same formatter as its fifth argument.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'error-handling', 'composition'],
  apiComponents: ['CngxErrorAggregator', 'CngxErrorScope', 'CngxErrorSource'],
  moduleImports: [
    "import { CngxErrorAggregator, CngxErrorScope, CngxErrorSource } from '@cngx/common/interactive';",
  ],
  imports: ['CngxErrorScope', 'CngxErrorAggregator', 'CngxErrorSource'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-live',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live',
    },
    {
      label: 'WCAG 2.1 SC 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html',
    },
  ],
  setup: `protected readonly cardMissing = signal(true);
  protected readonly addressMissing = signal(true);
  protected readonly countMessage = (count: number): string =>
    count === 1 ? '1 field needs attention' : \`\${count} fields need attention\`;`,
  template: `
  <form
    novalidate
    cngxErrorScope
    #scope="cngxErrorScope"
    (submit)="$event.preventDefault(); scope.reveal()"
    class="demo-error-surface"
    [class.cngx-error]="checkout.shouldShow()"
  >
    <fieldset
      cngxErrorAggregator
      #checkout="cngxErrorAggregator"
      [errorCountAnnouncement]="countMessage"
      style="border: none; padding: 0; margin: 0;"
    >
      <legend style="font-weight: 600;">Checkout</legend>
      <span cngxErrorSource="card" [when]="cardMissing()"></span>
      <span cngxErrorSource="address" [when]="addressMissing()"></span>

      <div class="button-row" style="margin-top: 12px;">
        <button type="submit">Place order</button>
        <button type="button" (click)="scope.reset()">Reset</button>
      </div>
    </fieldset>
  </form>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row"><span class="event-label">errorCount()</span><span class="event-value">{{ checkout.errorCount() }}</span></div>
    <div class="event-row"><span class="event-label">errorLabels()</span><span class="event-value">{{ checkout.errorLabels().length }}</span></div>
    <div class="event-row"><span class="event-label">shouldShow()</span><span class="event-value">{{ checkout.shouldShow() }}</span></div>
    <div class="event-row"><span class="event-label">announcement()</span><span class="event-value">{{ checkout.announcement() || '-' }}</span></div>
  </div>
  <div class="button-row" style="margin-top: 12px;">
    <button type="button" (click)="cardMissing.set(!cardMissing())">Toggle card</button>
    <button type="button" (click)="addressMissing.set(!addressMissing())">Toggle address</button>
  </div>`,
};
