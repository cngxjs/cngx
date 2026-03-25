import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'SkeletonContainer',
  navLabel: 'Skeleton',
  description:
    'Skeleton loading container with placeholder template repetition and automatic loading/content switching.',
  apiComponents: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
  overview:
    '<p><code>CngxSkeletonContainer</code> wraps the headless <code>CngxSkeleton</code> directive into a component ' +
    'with content projection. Project a <code>cngxSkeletonPlaceholder</code> template for the loading state ' +
    'and your real content for the loaded state. No <code>@if</code>/<code>@for</code> needed.</p>',
  moduleImports: [
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
      title: 'Card Skeleton',
      subtitle:
        'The placeholder template is repeated <code>[count]</code> times while loading. ' +
        'Toggle the button to switch between skeleton and content.',
      imports: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
      template: `
  <div class="button-row" style="margin-bottom:16px">
    <button class="chip" [class.chip--active]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>
  <cngx-skeleton [loading]="loading()" [count]="3">
    <ng-template cngxSkeletonPlaceholder let-i let-last="last">
      <div style="display:flex;gap:12px;padding:16px;border:1px solid var(--cngx-border,#e0e0e0);border-radius:8px;margin-bottom:12px">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--cngx-surface-alt,#e0e0e0);flex-shrink:0"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
          <div style="height:14px;width:40%;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
          <div style="height:12px;border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
          <div [style.height]="'12px'" [style.width]="last ? '60%' : '85%'"
            style="border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
        </div>
      </div>
    </ng-template>
    @for (i of [1, 2, 3]; track i) {
      <div style="padding:16px;border:1px solid var(--cngx-border,#e0e0e0);border-radius:8px;margin-bottom:12px">
        <strong>User {{ i }}</strong>
        <p style="margin:4px 0 0;color:var(--text-muted,#666)">Content loaded successfully.</p>
      </div>
    }
  </cngx-skeleton>`,
    },
    {
      title: 'Template Context',
      subtitle:
        'The placeholder template receives <code>$implicit</code> (index), <code>count</code>, <code>first</code>, <code>last</code>. ' +
        'Use them to vary the skeleton appearance.',
      imports: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
      template: `
  <cngx-skeleton [loading]="true" [count]="5">
    <ng-template cngxSkeletonPlaceholder let-i let-first="first" let-last="last" let-count="count">
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--cngx-border,#e0e0e0)">
        <span style="font-size:0.75rem;color:var(--text-muted,#999);width:24px">{{ i + 1 }}/{{ count }}</span>
        <div [style.height]="'12px'" [style.width]="first ? '70%' : last ? '40%' : '55%'"
          style="border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
      </div>
    </ng-template>
    <p>Content here after loading</p>
  </cngx-skeleton>`,
    },
  ],
};
