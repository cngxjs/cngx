import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSkeletonContainer: template context',
  subtitle: 'The placeholder template receives <code>$implicit</code> (index), <code>count</code>, <code>first</code>, <code>last</code>. Use them to vary the skeleton appearance.',
  description: 'Reference for the placeholder template context: <code>$implicit</code>, <code>count</code>, <code>first</code>, <code>last</code> all read, each row varies in width by position. Use as a recipe when authoring custom skeletons.',
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
  template: `
  <cngx-skeleton [loading]="loading()" [count]="5">
    <ng-template cngxSkeletonPlaceholder let-i let-first="first" let-last="last" let-count="count">
      <div class="demo-skeleton-rule">
        <span class="demo-skeleton-rule__index">{{ i + 1 }}/{{ count }}</span>
        <div class="demo-skeleton-line demo-skeleton-line--body"
          [style.width]="first ? '70%' : last ? '40%' : '55%'"></div>
      </div>
    </ng-template>
    <p>Content here after loading</p>
  </cngx-skeleton>`,
  templateChrome: `<div class="button-row" style="margin-bottom:16px">
    <button type="button" class="chip" [attr.aria-pressed]="loading()" (click)="loading.update((v) => !v)">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>`,
};
