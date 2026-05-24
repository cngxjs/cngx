import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLoadingIndicator: spinner variant',
  subtitle: 'Default variant. Appears after 200ms delay, stays at least 500ms.',
  description: 'Inline spinner variant: a button toggles a 2s loading state next to a status label. Built-in delay + min-duration thresholds prevent the spinner from flashing on sub-200ms operations.',
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
  <button (click)="handleToggle()" class="chip" type="button">
    {{ isLoading() ? 'Loading...' : 'Start Loading (2s)' }}
  </button>
  <div class="demo-row-center" style="margin-top:16px">
    <cngx-loading-indicator [loading]="isLoading()" variant="spinner" label="Loading data" />
    <span>{{ isLoading() ? 'Fetching data...' : 'Idle' }}</span>
  </div>`,
};
