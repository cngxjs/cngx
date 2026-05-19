import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic Skeleton',
  subtitle: 'Apply <code>[cngxSkeleton]</code> to any element. When the bound value is <code>true</code>, the element shows a shimmer animation.',
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
    'import { CngxSkeleton } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxSkeleton'],
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
  <div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin-top:16px">
    <div [cngxSkeleton]="loading()"
      style="height:20px;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
    <div [cngxSkeleton]="loading()"
      style="height:20px;width:75%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
    <div [cngxSkeleton]="loading()"
      style="height:20px;width:50%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
  </div>`,
};
