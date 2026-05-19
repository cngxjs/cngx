import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Spinner Variant',
  subtitle: 'Default variant. Appears after 200ms delay, stays at least 500ms.',
  description: 'Purely visual loading indicator — spinner or bar variant. Delay + minDuration prevent flash.',
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
  setup: `protected readonly isLoading = signal(false);
  protected handleToggle(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2000);
  }`,
  template: `
  <button (click)="handleToggle()" class="chip">
    {{ isLoading() ? 'Loading...' : 'Start Loading (2s)' }}
  </button>
  <div style="margin-top:16px;display:flex;align-items:center;gap:12px">
    <cngx-loading-indicator [loading]="isLoading()" variant="spinner" label="Loading data" />
    <span>{{ isLoading() ? 'Fetching data...' : 'Idle' }}</span>
  </div>`,
};
