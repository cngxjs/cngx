import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card Skeleton',
  subtitle: 'The placeholder template is repeated <code>[count]</code> times while loading. Toggle the button to switch between skeleton and content.',
  description: 'Skeleton loading container with placeholder template repetition and automatic loading/content switching.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'async-state'],
  apiComponents: [
    'CngxSkeletonContainer',
    'CngxSkeletonPlaceholder',
  ],
  moduleImports: [
    'import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from \'@cngx/ui\';',
  ],
  imports: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
  setup: `protected readonly loading = signal(true);`,
  setupChrome: `  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }`,
  template: `  <cngx-skeleton [loading]="loading()" [count]="3">
    <ng-template cngxSkeletonPlaceholder let-i let-last="last">
      <div style="display:flex;gap:12px;padding:16px;border:1px solid var(--cngx-color-border,#e0e0e0);border-radius:8px;margin-bottom:12px">
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
      <div style="padding:16px;border:1px solid var(--cngx-color-border,#e0e0e0);border-radius:8px;margin-bottom:12px">
        <strong>User {{ i }}</strong>
        <p style="margin:4px 0 0;color:var(--cngx-color-text-muted)">Content loaded successfully.</p>
      </div>
    }
  </cngx-skeleton>`,
  templateChrome: `<div class="button-row" style="margin-bottom:16px">
    <button class="chip" [class.chip--active]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>`,
};
