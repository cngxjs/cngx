import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Autofocus',
  navLabel: 'Autofocus',
  navCategory: 'a11y',
  description:
    'Reactive autofocus for dynamically inserted elements. Works where native autofocus fails (dialogs, panels, conditional views).',
  apiComponents: ['CngxAutofocus'],
  overview:
    '<p>The native <code>autofocus</code> attribute only works on initial page load. ' +
    '<code>[cngxAutofocus]</code> handles dynamic content — focusing elements when they appear or when a condition becomes true.</p>',
  moduleImports: [
    "import { CngxAutofocus } from '@cngx/common/a11y';",
  ],
  setup: `
  protected readonly showSearch = signal(false);
  protected readonly conditionMet = signal(false);
  `,
  sections: [
    {
      title: 'Focus on Insert',
      subtitle:
        'Toggle the search bar. The input is automatically focused when it appears.',
      imports: ['CngxAutofocus'],
      template: `
  <button (click)="showSearch.set(!showSearch())" class="chip">
    {{ showSearch() ? 'Hide Search' : 'Show Search' }}
  </button>

  @if (showSearch()) {
    <div style="margin-top:12px">
      <input [cngxAutofocus]="true" placeholder="Search..."
             style="padding:8px 12px;border:1px solid var(--cngx-border,#ddd);border-radius:6px;width:240px" />
    </div>
  }`,
    },
    {
      title: 'Conditional Focus',
      subtitle:
        'The input is always rendered, but focus is applied only when the condition becomes <code>true</code>.',
      imports: ['CngxAutofocus'],
      template: `
  <button (click)="conditionMet.set(!conditionMet())" class="chip">
    {{ conditionMet() ? 'Deactivate' : 'Activate Field' }}
  </button>
  <div style="margin-top:12px">
    <input [cngxAutofocus]="conditionMet()" placeholder="Focused when active"
           style="padding:8px 12px;border:1px solid var(--cngx-border,#ddd);border-radius:6px;width:240px" />
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Condition</span>
      <span class="event-value">{{ conditionMet() }}</span>
    </div>
  </div>`,
    },
  ],
};
