import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSkeletonContainer: flash-suppressed placeholder',
  subtitle:
    'A load faster than <code>showDelay</code> never flashes the placeholder; a slow load shows it and holds for <code>minDwell</code>. Defaults: 120ms / 400ms.',
  description:
    'The placeholder is gated by createVisibilityGate. Trigger a fast load (under the show delay) and the placeholder never appears, so a sub-perceptual blip stays invisible. Trigger a slow load and the placeholder shows after the delay and stays at least the min-dwell, so it never flickers out.',
  level: 'molecule',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'behavior', 'a11y-pattern'],
  apiComponents: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
  moduleImports: ["import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from '@cngx/ui';"],
  imports: ['CngxSkeletonContainer', 'CngxSkeletonPlaceholder'],
  setup: `protected readonly loading = signal(false);`,
  setupChrome: `  private timer?: ReturnType<typeof setTimeout>;
  protected simulate(durationMs: number): void {
    clearTimeout(this.timer);
    this.loading.set(true);
    this.timer = setTimeout(() => this.loading.set(false), durationMs);
  }`,
  template: `  <cngx-skeleton [loading]="loading()" [count]="3" style="display:flex;flex-direction:column;gap:16px;margin-top:16px">
    <ng-template cngxSkeletonPlaceholder>
      <div class="demo-skeleton-card">
        <div class="demo-skeleton-line demo-skeleton-line--md" style="width:40%"></div>
        <div class="demo-skeleton-line demo-skeleton-line--sm"></div>
        <div class="demo-skeleton-line demo-skeleton-line--sm" style="width:80%"></div>
      </div>
    </ng-template>
    @for (i of [1, 2, 3]; track i) {
      <div class="demo-skeleton-card">
        <strong>Card {{ i }}</strong>
        <p style="margin:4px 0 0">Content loaded successfully.</p>
      </div>
    }
  </cngx-skeleton>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="chip" (click)="simulate(80)">Fast load (80ms, no flash)</button>
    <button type="button" class="chip" (click)="simulate(1500)">Slow load (1.5s, shows skeleton)</button>
  </div>`,
};
