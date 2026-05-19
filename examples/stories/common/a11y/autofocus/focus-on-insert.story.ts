import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Focus on Insert',
  subtitle: 'Toggle the search bar. The input is automatically focused when it appears.',
  description: 'Reactive autofocus for dynamically inserted elements. Works where native autofocus fails (dialogs, panels, conditional views).',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxAutofocus',
  ],
  moduleImports: [
    'import { CngxAutofocus } from \'@cngx/common/a11y\';',
  ],
  imports: ['CngxAutofocus'],
  setup: `protected readonly showSearch = signal(false);`,
  template: `
  <button (click)="showSearch.set(!showSearch())" class="chip">
    {{ showSearch() ? 'Hide Search' : 'Show Search' }}
  </button>

  @if (showSearch()) {
    <div style="margin-top:12px">
      <input [cngxAutofocus]="true" placeholder="Search..."
             style="padding:8px 12px;border:1px solid var(--cngx-color-border,#ddd);border-radius:6px;width:240px" />
    </div>
  }`,
};
