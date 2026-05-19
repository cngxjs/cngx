import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Search — declarative <cngx-select-search>',
  subtitle: 'Project <code>&lt;cngx-select-search /&gt;</code> as a child to add a filter input as the first item in the panel. The search element finds the shell via <code>CNGX_SELECT_SHELL_SEARCH_HOST</code>, two-way binds the term, and forwards <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Home</kbd> <kbd>End</kbd> <kbd>Enter</kbd> <kbd>Esc</kbd> into the listbox AD. Each projected <code>&lt;cngx-option&gt;</code> reads <code>CNGX_OPTION_FILTER_HOST</code> and hides itself when the resolved label does not match — AD nav and visual filter stay in lockstep.',
  description: 'CngxSelectShell — single-value declarative-options dropdown. Project user-authored <cngx-option> / <cngx-optgroup> children directly; the shell derives a hierarchy-aware option model and runs the same family-level intelligence (createSelectCore, createFieldSync, createScalarCommitHandler, announcer) as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelectShell',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
  ],
  moduleImports: [
    'import { CngxSelectShell, CngxSelectOption, CngxSelectSearch } from \'@cngx/forms/select\';',
    'import { of } from \'rxjs\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectSearch'],
  setup: `protected readonly searchValue = signal<string | undefined>(undefined);
  protected readonly searchTerm = signal<string>('');
  protected readonly cities = [
    'Amsterdam', 'Berlin', 'Cologne', 'Dresden', 'Edinburgh', 'Frankfurt',
    'Geneva', 'Hamburg', 'Innsbruck', 'Jena', 'Krakow', 'Lisbon', 'Madrid',
    'Munich', 'Nice', 'Oslo', 'Paris', 'Reykjavik', 'Stockholm', 'Tallinn',
    'Utrecht', 'Vienna', 'Warsaw', 'Zurich',
  ];`,
  template: `
  <cngx-select-shell
    [label]="'City'"
    [(value)]="searchValue"
    [(searchTerm)]="searchTerm"
    [clearable]="true"
    placeholder="Pick a city…"
  >
    <cngx-select-search [placeholder]="'Filter cities…'" />
    @for (city of cities; track city) {
      <cngx-option [value]="city">{{ city }}</cngx-option>
    }
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">searchTerm</span>
      <span class="event-value">{{ searchTerm() || '(none)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ searchValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">tip</span>
      <span class="event-value">Open + type "be" → only Berlin / Berlin-prefixed remain. Press <kbd>↓</kbd> + <kbd>Enter</kbd> to pick.</span>
    </div>
  </div>`,
};
