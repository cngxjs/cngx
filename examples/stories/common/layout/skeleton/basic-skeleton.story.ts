import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSkeleton: Basic skeleton',
  subtitle:
    'Apply <code>[cngxSkeleton]</code> to any element. While the bound value is <code>true</code>, the directive sets <code>cngx-skeleton--loading</code> and (unless reduced motion) <code>cngx-skeleton--shimmer</code>, plus <code>aria-busy</code>.',
  description:
    'Three skeleton bars driven by a single loading() signal. The directive owns the loading flag and aria-busy attribute; the demo styles attach the bar shape and the shimmer gradient that hooks into the .cngx-skeleton--shimmer host class.',
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
    <div [cngxSkeleton]="loading()" class="demo-skeleton-line"></div>
    <div [cngxSkeleton]="loading()" class="demo-skeleton-line" style="width:75%"></div>
    <div [cngxSkeleton]="loading()" class="demo-skeleton-line" style="width:50%"></div>
  </div>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="chip" [attr.aria-pressed]="loading()" (click)="toggleLoading()">
      {{ loading() ? 'Loading...' : 'Loaded' }}
    </button>
  </div>`,
};
