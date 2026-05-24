import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSkeletonContainer: card skeleton',
  subtitle: 'The placeholder template is repeated <code>[count]</code> times while loading. Toggle the button to switch between skeleton and content.',
  description: 'Avatar + headline + body placeholder repeated <code>[count]=3</code> times. Toggles between loading and loaded so the swap is observable; the placeholder template uses <code>let-last</code> to vary the last line width.',
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
      <div class="demo-skeleton-row">
        <div class="demo-skeleton-avatar"></div>
        <div class="demo-skeleton-lines">
          <div class="demo-skeleton-line demo-skeleton-line--title"></div>
          <div class="demo-skeleton-line demo-skeleton-line--body" style="width:85%"></div>
          <div class="demo-skeleton-line demo-skeleton-line--body" [style.width]="last ? '60%' : '85%'"></div>
        </div>
      </div>
    </ng-template>
    @for (i of [1, 2, 3]; track i) {
      <div class="demo-card-loaded">
        <strong>User {{ i }}</strong>
        <p>Content loaded successfully.</p>
      </div>
    }
  </cngx-skeleton>`,
  templateChrome: `<div class="button-row" style="margin-bottom:16px">
    <button type="button" class="chip" [attr.aria-pressed]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>`,
};
