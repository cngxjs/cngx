import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLoadingIndicator: bar variant',
  subtitle: 'YouTube-style thin line. Place at the top of a container. Click the toggle below to start/stop the 2s simulated load.',
  description: 'Thin top-of-container bar variant: positions absolutely against a relative wrapper so it overlays content rather than displacing it. Use for ambient progress signals that should not steal layout space.',
  setupChrome: `  protected handleToggle(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2000);
  }`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button type="button" class="chip" (click)="handleToggle()">
      {{ isLoading() ? 'Loading...' : 'Start Loading (2s)' }}
    </button>
  </div>`,
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'async-state'],
  apiComponents: [
    'CngxLoadingIndicator',
  ],
  moduleImports: [
    'import { CngxLoadingIndicator } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxLoadingIndicator'],
  setup: `protected readonly isLoading = signal(false);`,
  template: `
  <div class="demo-frame-relative">
    <cngx-loading-indicator [loading]="isLoading()" variant="bar" label="Refreshing"
      style="position:absolute;top:0;left:0;right:0" />
    <p>Container content. Click "Start Loading" above to see the bar.</p>
  </div>`,
};
