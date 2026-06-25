import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelectSearch: search',
  subtitle:
    'Project <code>&lt;cngx-select-search /&gt;</code> as the first child to add a filter input at the top of the panel. It finds the shell via <code>CNGX_SELECT_SHELL_SEARCH_HOST</code>, two-way binds the term, and forwards <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Enter</kbd> into the listbox so keyboard nav and visual filter stay in lockstep.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelectSearch', 'CngxSelectShell', 'CngxSelectOption'],
  moduleImports: [
    "import { CngxSelectShell, CngxSelectOption, CngxSelectSearch } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectSearch'],
  setup: `protected readonly value = signal<string | undefined>(undefined);
  protected readonly term = signal<string>('');
  protected readonly fruits = ['Apple', 'Apricot', 'Banana', 'Cherry', 'Mango', 'Peach'];`,
  template: `  <cngx-select-shell
    [label]="'Fruit'"
    [(value)]="value"
    [(searchTerm)]="term"
    placeholder="Pick a fruit…"
  >
    <cngx-select-search [placeholder]="'Filter fruit…'" />
    @for (fruit of fruits; track fruit) {
      <cngx-option [value]="fruit">{{ fruit }}</cngx-option>
    }
  </cngx-select-shell>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">searchTerm</span>
      <span class="event-value">{{ term() || '(none)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ value() ?? '—' }}</span>
    </div>
  </div>`,
};
