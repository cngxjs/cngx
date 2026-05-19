import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Loading State',
  subtitle: '<code>[loading]="true"</code> sets <code>aria-busy</code> and announces <em>Loading</em> via SR live region. Toggle <em>Replace with skeleton</em> to compare the aria-only path against a visual <code>cngx-card-skeleton</code> placeholder.',
  description: 'Semantic card component with three archetypes: display (article), action (button), and link. Supports selection, loading, disabled with reason, and SR live announcements.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxCardMedia',
    'CngxCardFooter',
    'CngxCardActions',
    'CngxCardBadge',
    'CngxCardAccent',
    'CngxCardSkeleton',
  ],
  moduleImports: [
    'import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody, CngxCardSkeleton } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxCardSkeleton'],
  setup: `protected loading = signal(false);
  protected showSkeleton = signal(false);`,
  template: `
  <div class="button-row" style="margin-bottom:12px">
    <button (click)="loading.update(v => !v)">Toggle loading: {{ loading() ? 'on' : 'off' }}</button>
    <label style="display:flex;align-items:center;gap:6px;font-size:0.875rem">
      <input type="checkbox" [checked]="showSkeleton()" (change)="showSkeleton.set($any($event.target).checked)" />
      Replace with skeleton
    </label>
  </div>
  <div style="max-width:320px">
    <cngx-card [loading]="loading()">
      @if (loading() && showSkeleton()) {
        <cngx-card-skeleton [lines]="2" />
      } @else {
        <ng-container>
          <header cngxCardHeader>
            <h3 cngxCardTitle>Vitals Overview</h3>
          </header>
          <div cngxCardBody>
            <p style="margin:0;color:var(--cngx-color-text-muted)">Heart rate, blood pressure, SpO2 values from the last 24 hours.</p>
          </div>
        </ng-container>
      }
    </cngx-card>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">loading</span>
      <span class="event-value">{{ loading() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">aria-busy</span>
      <span class="event-value">{{ loading() ? 'true' : 'false' }}</span>
    </div>
  </div>`,
};
