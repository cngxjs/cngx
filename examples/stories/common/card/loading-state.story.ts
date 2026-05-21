import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCard: Loading state',
  subtitle:
    '<code>[loading]="true"</code> paints <code>aria-busy</code> on the host and announces <em>Loading</em> via the card\'s SR live region. The <em>Replace with skeleton</em> toggle swaps the body for <code>&lt;cngx-card-skeleton&gt;</code>, comparing the ARIA-only path against a visual placeholder.',
  description:
    'Two loading communication strategies on the same card: aria-busy alone (the screen reader hears the status, the eye sees the existing content) versus aria-busy paired with a skeleton placeholder (both channels carry the same message). Flip both toggles to compare; the readout shows the resulting <code>aria-busy</code> attribute.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'a11y-pattern'],
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardBody',
    'CngxCardSkeleton',
  ],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody, CngxCardSkeleton } from '@cngx/common/card';",
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxCardSkeleton'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-busy',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-busy',
    },
    {
      label: 'WCAG 2.1 SC 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html',
    },
  ],
  setup: `protected readonly loading = signal(false);
  protected readonly showSkeleton = signal(false);
  protected readonly skeletonActive = computed(() => this.loading() && this.showSkeleton());`,
  template: `  <div style="max-width:320px">
    <cngx-card [loading]="loading()">
      @if (skeletonActive()) {
        <cngx-card-skeleton [lines]="2" />
      }
      @if (!skeletonActive()) {
        <header cngxCardHeader><h3 cngxCardTitle>Build metrics</h3></header>
      }
      @if (!skeletonActive()) {
        <div cngxCardBody>
          <p style="margin:0">Build duration, test coverage, and error rate over the last 24 hours.</p>
        </div>
      }
    </cngx-card>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button type="button" class="chip" (click)="loading.update((v) => !v)">
      Toggle loading: {{ loading() ? 'on' : 'off' }}
    </button>
    <label style="display:flex;align-items:center;gap:6px;font-size:0.875rem">
      <input type="checkbox"
             [checked]="showSkeleton()"
             (change)="showSkeleton.set($any($event.target).checked)" />
      Replace with skeleton
    </label>
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
