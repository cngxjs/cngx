import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Loading Indicator',
  navLabel: 'Loading Indicator',
  navCategory: 'feedback',
  description: 'Purely visual loading indicator — spinner or bar variant. Delay + minDuration prevent flash.',
  apiComponents: ['CngxLoadingIndicator'],
  moduleImports: [
    "import { CngxLoadingIndicator } from '@cngx/ui/feedback';",
  ],
  setup: `
  protected readonly isLoading = signal(false);

  protected handleToggle(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2000);
  }
  `,
  sections: [
    {
      title: 'Spinner Variant',
      subtitle: 'Default variant. Appears after 200ms delay, stays at least 500ms.',
      imports: ['CngxLoadingIndicator'],
      template: `
  <button (click)="handleToggle()" class="chip">
    {{ isLoading() ? 'Loading...' : 'Start Loading (2s)' }}
  </button>
  <div style="margin-top:16px;display:flex;align-items:center;gap:12px">
    <cngx-loading-indicator [loading]="isLoading()" variant="spinner" label="Loading data" />
    <span>{{ isLoading() ? 'Fetching data...' : 'Idle' }}</span>
  </div>`,
    },
    {
      title: 'Bar Variant',
      subtitle: 'YouTube-style thin line. Place at the top of a container.',
      imports: ['CngxLoadingIndicator'],
      template: `
  <div style="position:relative;border:1px solid var(--cngx-border,#ddd);border-radius:8px;padding:24px;min-height:80px">
    <cngx-loading-indicator [loading]="isLoading()" variant="bar" label="Refreshing"
      style="position:absolute;top:0;left:0;right:0" />
    <p>Container content. Click "Start Loading" above to see the bar.</p>
  </div>`,
    },
  ],
};
