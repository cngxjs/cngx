import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'injectErrorAggregator: Programmatic aggregator from a service',
  subtitle: '<code>injectErrorAggregator(name, sources, scope?, labels?)</code> returns a DOM-free <code>CngxErrorAggregatorContract</code> with the same derived signals the directive form exposes.',
  description: 'Positional-argument factory, not a config-options bag (Pillar 3). Pass the source map as <code>Record&lt;string, Signal&lt;boolean&gt;&gt;</code> and optional labels as <code>Record&lt;string, string&gt;</code>; the function builds the same <code>hasError</code> / <code>errorCount</code> / <code>activeErrors</code> / <code>announcement</code> graph the <code>[cngxErrorAggregator]</code> directive exposes, delegating to <code>createErrorAggregatorContract</code> so both forms share one source of truth. The optional <code>name</code> registers with the ambient <code>CngxErrorRegistry</code> for cross-component lookup; the optional <code>scope</code> ties <code>shouldShow</code> to a parent reveal gate. Useful when an aggregator must exist alongside a service-driven validation flow that does not own a DOM host.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'injectErrorAggregator',
  ],
  moduleImports: [
    'import { injectErrorAggregator } from \'@cngx/common/interactive\';',
    "import { CngxLiveRegion } from '@cngx/common/a11y';",
  ],
  imports: ['CngxLiveRegion'],
  setup: `
  protected readonly formatInvalid = signal<boolean>(true);
  protected readonly serverTaken = signal<boolean>(false);

  protected readonly aggregator = injectErrorAggregator(
    'checkout-email',
    {
      'email-format': this.formatInvalid,
      'email-taken': this.serverTaken,
    },
    undefined,
    {
      'email-format': 'Format invalid',
      'email-taken': 'Already in use',
    },
  );`,
  template: `
  <section role="region" aria-labelledby="iea-heading" style="display:flex; flex-direction:column; gap:8px; max-width:28rem">
    <h2 id="iea-heading" style="margin:0; font-size:1em">Email validation</h2>
    @if (aggregator.shouldShow()) {
      <ul role="alert" class="demo-error-list" style="margin:0">
        @for (label of aggregator.errorLabels(); track label) {
          <li>{{ label }}</li>
        }
      </ul>
    } @else {
      <p style="margin:0">No active errors.</p>
    }
  </section>
  <span class="cngx-sr-only" cngxLiveRegion>{{ aggregator.announcement() }}</span>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="formatInvalid()" (change)="formatInvalid.set($any($event.target).checked)" />
      Format invalid
    </label>
    <label>
      <input type="checkbox" [checked]="serverTaken()" (change)="serverTaken.set($any($event.target).checked)" />
      Server says taken
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">hasError()</span>
      <span class="event-value">{{ aggregator.hasError() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">errorCount()</span>
      <span class="event-value">{{ aggregator.errorCount() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">announcement()</span>
      <span class="event-value">{{ aggregator.announcement() || '-' }}</span>
    </div>
  </div>`,
};
