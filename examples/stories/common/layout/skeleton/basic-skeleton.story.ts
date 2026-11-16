import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSkeleton: Basic skeleton',
  subtitle:
    'Apply <code>[cngxSkeleton]</code> to any element. While the bound value is <code>true</code>, the directive sets <code>cngx-skeleton--loading</code> and (unless reduced motion) <code>cngx-skeleton--shimmer</code>, plus <code>aria-busy</code>.',
  description:
    'Three skeleton bars driven by a single loading() signal. The directive owns the loading flag and aria-busy attribute; the bar inside each host belongs to the consumer: its shape and the shimmer gradient hook into the .cngx-skeleton--shimmer host class.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'behavior'],
  apiComponents: ['CngxSkeleton'],
  moduleImports: ["import { CngxSkeleton } from '@cngx/common/layout';"],
  imports: ['CngxSkeleton'],
  setup: `protected readonly loading = signal(true);`,
  setupChrome: `  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }`,
  template: `  <div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin-top:16px">
    <div [cngxSkeleton]="loading()"><div class="demo-skeleton-line"></div></div>
    <div [cngxSkeleton]="loading()" style="width:75%"><div class="demo-skeleton-line"></div></div>
    <div [cngxSkeleton]="loading()" style="width:50%"><div class="demo-skeleton-line"></div></div>
  </div>`,
  css: `.demo-skeleton-line {
  height: 20px;
  border-radius: 4px;
  background: var(--cngx-color-surface-2, var(--cngx-ex-surface-2, #e0e0e0));
}

.cngx-skeleton--shimmer .demo-skeleton-line {
  background: linear-gradient(
    90deg,
    var(--cngx-color-surface-2, var(--cngx-ex-surface-2, #f0f0f0)) 25%,
    var(--cngx-color-surface-3, var(--cngx-ex-surface-3, #e5e5e5)) 50%,
    var(--cngx-color-surface-2, var(--cngx-ex-surface-2, #f0f0f0)) 75%
  );
  background-size: 200% 100%;
  animation: demo-skeleton-shimmer 1.4s ease-in-out infinite;
}

.demo-skeleton-line {
  border-radius: 4px;
  background: var(--cngx-surface-alt, #e0e0e0);
}

@keyframes demo-skeleton-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}`,
  templateChrome: `<div class="button-row">
    <button type="button" class="chip" [attr.aria-pressed]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>`,
};
