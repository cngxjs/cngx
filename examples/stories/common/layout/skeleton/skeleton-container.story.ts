import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSkeletonContainer: Skeleton container',
  subtitle:
    'Wrap content in <code>&lt;cngx-skeleton&gt;</code> with a <code>count</code> input to repeat a projected <code>cngxSkeletonPlaceholder</code> template, then render the real content directly in the same slot when loading flips off.',
  description:
    'Demonstrates the placeholder/content swap: cngx-skeleton repeats the projected <ng-template cngxSkeletonPlaceholder> three times while loading is true, then renders the @for of real cards when loading() flips to false.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
  moduleImports: ["import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from '@cngx/ui';"],
  imports: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
  setup: `protected readonly loading = signal(true);`,
  setupChrome: `  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }`,
  template: `  <cngx-skeleton [loading]="loading()" [count]="3" style="display:flex;flex-direction:column;gap:16px;margin-top:16px">
    <ng-template cngxSkeletonPlaceholder>
      <div class="demo-skeleton-card">
        <div class="demo-skeleton-line demo-skeleton-line--md" style="width:40%"></div>
        <div class="demo-skeleton-line demo-skeleton-line--sm"></div>
        <div class="demo-skeleton-line demo-skeleton-line--sm" style="width:80%"></div>
      </div>
    </ng-template>
    @if (!loading()) {
      @for (i of [1, 2, 3]; track i) {
        <div class="demo-skeleton-card">
          <strong>Card {{ i }}</strong>
          <p style="margin:4px 0 0">Content loaded successfully.</p>
        </div>
      }
    }
  </cngx-skeleton>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="chip" [attr.aria-pressed]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>`,
};
