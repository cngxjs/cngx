import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Skeleton Container',
  subtitle: 'Use <code>cngx-skeleton</code> with a <code>count</code> input to repeat placeholder templates. Project your real content and a <code>CngxSkeletonPlaceholder</code> template.',
  description: 'Skeleton placeholder directives for loading states. Use CngxSkeleton for individual elements or CngxSkeletonContainer with CngxSkeletonPlaceholder for grouped placeholder templates.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'async-state'],
  apiComponents: [
    'CngxSkeleton',
    'CngxSkeletonContainer',
    'CngxSkeletonPlaceholder',
  ],
  moduleImports: [
    'import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from \'@cngx/ui\';',
  ],
  imports: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
  setup: `protected readonly loading = signal(true);
  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }`,
  template: `
  <div class="button-row">
    <button class="chip" [class.chip--active]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>
  <cngx-skeleton [loading]="loading()" [count]="3" style="display:flex;flex-direction:column;gap:16px;margin-top:16px">
    <ng-template cngxSkeletonPlaceholder>
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;border:1px solid var(--cngx-color-border,#e0e0e0);border-radius:8px">
        <div style="height:16px;width:40%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
        <div style="height:12px;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
        <div style="height:12px;width:80%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
      </div>
    </ng-template>
    @if (!loading()) {
      @for (i of [1, 2, 3]; track i) {
        <div style="padding:16px;border:1px solid var(--cngx-color-border,#e0e0e0);border-radius:8px">
          <strong>Card {{ i }}</strong>
          <p style="margin:4px 0 0">Content loaded successfully.</p>
        </div>
      }
    }
  </cngx-skeleton>`,
};
