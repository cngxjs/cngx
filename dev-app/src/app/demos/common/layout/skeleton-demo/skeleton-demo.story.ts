import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Skeleton Loading',
  navLabel: 'Skeleton',
  navCategory: 'layout',
  description:
    'Skeleton placeholder directives for loading states. Use CngxSkeleton for individual elements or CngxSkeletonContainer with CngxSkeletonPlaceholder for grouped placeholder templates.',
  apiComponents: ['CngxSkeleton', 'CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
  overview:
    '<p><code>CngxSkeleton</code> is a directive that adds a shimmer animation to any element while loading. ' +
    '<code>CngxSkeletonContainer</code> orchestrates multiple skeleton placeholders via a <code>count</code> input ' +
    'and projects <code>CngxSkeletonPlaceholder</code> templates when loading.</p>',
  moduleImports: [
    "import { CngxSkeleton } from '@cngx/common/layout';",
    "import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from '@cngx/ui';",
  ],
  setup: `
  protected readonly loading = signal(true);

  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }
  `,
  sections: [
    {
      title: 'Basic Skeleton',
      subtitle:
        'Apply <code>[cngxSkeleton]</code> to any element. When the bound value is <code>true</code>, ' +
        'the element shows a shimmer animation.',
      imports: ['CngxSkeleton'],
      template: `
  <div class="button-row">
    <button class="chip" [class.chip--active]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin-top:16px">
    <div [cngxSkeleton]="loading()"
      style="height:20px;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
    <div [cngxSkeleton]="loading()"
      style="height:20px;width:75%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
    <div [cngxSkeleton]="loading()"
      style="height:20px;width:50%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
  </div>`,
    },
    {
      title: 'Skeleton Container',
      subtitle:
        'Use <code>cngx-skeleton</code> with a <code>count</code> input to repeat placeholder templates. ' +
        'Project your real content and a <code>CngxSkeletonPlaceholder</code> template.',
      imports: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
      template: `
  <div class="button-row">
    <button class="chip" [class.chip--active]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>
  <cngx-skeleton [loading]="loading()" [count]="3" style="display:flex;flex-direction:column;gap:16px;margin-top:16px">
    <ng-template cngxSkeletonPlaceholder>
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;border:1px solid var(--cngx-border,#e0e0e0);border-radius:8px">
        <div style="height:16px;width:40%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
        <div style="height:12px;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
        <div style="height:12px;width:80%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
      </div>
    </ng-template>
    @if (!loading()) {
      @for (i of [1, 2, 3]; track i) {
        <div style="padding:16px;border:1px solid var(--cngx-border,#e0e0e0);border-radius:8px">
          <strong>Card {{ i }}</strong>
          <p style="margin:4px 0 0">Content loaded successfully.</p>
        </div>
      }
    }
  </cngx-skeleton>`,
    },
  ],
};
