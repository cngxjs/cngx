import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorSource: Register with aggregator',
  subtitle: 'Each <code>[cngxErrorSource]="key" [when]="condition"</code> registers a live error condition with the nearest <code>CngxErrorAggregator</code> ancestor; the aggregator computes the count and announcement signals.',
  description: 'Pure DI-propagation directive, zero DOM output. The directive injects <code>CNGX_ERROR_AGGREGATOR</code> optionally and is a no-op without one. Each instance contributes a key + a live <code>Signal&lt;boolean&gt;</code> + an optional label to the aggregator\'s sources map. The aggregator\'s <code>errorCount()</code>, <code>activeErrors()</code>, and <code>announcement()</code> are <code>computed()</code> with structural equality so toggling one source never cascades through unrelated descendants. Useful for surfacing errors that live outside the form-field presenter: server-side validation, async availability checks, business-rule conflicts.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxErrorSource',
    'CngxErrorAggregator',
  ],
  moduleImports: [
    'import { CngxErrorSource, CngxErrorAggregator } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxErrorSource', 'CngxErrorAggregator'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-live`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live' },
    { label: 'WCAG 2.1 SC 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
  ],
  setup: `
  protected readonly formatInvalid = signal<boolean>(true);
  protected readonly serverTaken = signal<boolean>(false);
  protected readonly conflictsWithBusinessRule = signal<boolean>(false);`,
  template: `
  <fieldset cngxErrorAggregator #agg="cngxErrorAggregator" style="display:flex; flex-direction:column; gap:8px; max-width:28rem">
    <legend>Email validation</legend>

    <span cngxErrorSource="email-format" [when]="formatInvalid()" label="Format invalid"></span>
    <span cngxErrorSource="email-taken" [when]="serverTaken()" label="Already in use"></span>
    <span cngxErrorSource="email-business-rule" [when]="conflictsWithBusinessRule()" label="Conflicts with another contact"></span>

    @if (agg.shouldShow()) {
      <ul role="alert" class="demo-error-list" style="margin:0">
        @for (label of agg.errorLabels(); track label) {
          <li>{{ label }}</li>
        }
      </ul>
    }
  </fieldset>`,
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
    <label>
      <input type="checkbox" [checked]="conflictsWithBusinessRule()" (change)="conflictsWithBusinessRule.set($any($event.target).checked)" />
      Business-rule conflict
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">errorCount()</span>
      <span class="event-value">{{ agg.errorCount() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">activeErrors keys</span>
      <span class="event-value">{{ activeKeysLabel(agg.activeErrors()) }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">announcement()</span>
      <span class="event-value">{{ agg.announcement() || '-' }}</span>
    </div>
  </div>`,
  setupChrome: `
  protected activeKeysLabel(keys: readonly string[]): string {
    if (keys.length === 0) return '-';
    return keys.join(', ');
  }`,
};
