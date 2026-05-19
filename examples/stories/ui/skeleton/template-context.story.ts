import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Template Context',
  subtitle: 'The placeholder template receives <code>$implicit</code> (index), <code>count</code>, <code>first</code>, <code>last</code>. Use them to vary the skeleton appearance.',
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
  template: `
  <cngx-skeleton [loading]="true" [count]="5">
    <ng-template cngxSkeletonPlaceholder let-i let-first="first" let-last="last" let-count="count">
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--cngx-color-border,#e0e0e0)">
        <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);width:24px">{{ i + 1 }}/{{ count }}</span>
        <div [style.height]="'12px'" [style.width]="first ? '70%' : last ? '40%' : '55%'"
          style="border-radius:4px;background:var(--cngx-surface-alt,#e0e0e0)"></div>
      </div>
    </ng-template>
    <p>Content here after loading</p>
  </cngx-skeleton>`,
};
