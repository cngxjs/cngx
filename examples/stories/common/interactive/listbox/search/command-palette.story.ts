import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxListboxSearch: command palette',
  subtitle:
    'Typing the input feeds CngxListboxSearch (debounced via the CngxSearch host directive); the listbox reads term + matchFn reactively, palette.hasSearchResults() drives the empty state, and aria-controls links the input to the listbox.',
  description:
    'Search-filtered command palette: a separate <input cngxListboxSearch> drives a sibling listbox via [cngxSearchRef], and the listbox owns aria-activedescendant while the input keeps focus and native text-editing keystrokes.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Listbox pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
    },
    {
      label: 'WCAG 1.3.1 Info and Relationships',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships',
    },
  ],
  apiComponents: ['CngxListboxSearch', 'CngxListbox', 'CngxOption'],
  moduleImports: [
    "import { CngxListbox, CngxListboxSearch, CngxOption } from '@cngx/common/interactive';",
  ],
  imports: ['CngxListbox', 'CngxListboxSearch', 'CngxOption'],
  setup: `protected readonly commands = signal<Array<{ value: string; label: string }>>([
    { value: 'open-file', label: 'Open file...' },
    { value: 'open-folder', label: 'Open folder...' },
    { value: 'save', label: 'Save' },
    { value: 'save-as', label: 'Save as...' },
    { value: 'close', label: 'Close' },
    { value: 'reload', label: 'Reload' },
  ]);
  protected readonly lastSelected = signal<string | null>(null);`,
  template: `  <input
    cngxListboxSearch
    class="demo-listbox-search"
    type="search"
    placeholder="Search commands..."
    aria-label="Search commands"
    aria-controls="palette-listbox"
    #search="cngxListboxSearch"
  />
  <div
    cngxListbox
    id="palette-listbox"
    [label]="'Palette'"
    [cngxSearchRef]="search"
    class="demo-listbox-surface demo-listbox-surface--scroll"
    style="margin-top:8px"
    tabindex="0"
    (valueChange)="lastSelected.set($any($event))"
    #palette="cngxListbox"
  >
    @let term = palette.searchTerm().toLowerCase();
    @for (cmd of commands(); track cmd.value) {
      @if (!term || cmd.label.toLowerCase().includes(term)) {
        <div cngxOption [value]="cmd.value" [label]="cmd.label">{{ cmd.label }}</div>
      }
    }
  </div>
  @if (!palette.hasSearchResults()) {
    <p class="demo-listbox-empty">No matching commands.</p>
  }`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Last selected</span>
      <span class="event-value">{{ lastSelected() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Search term</span>
      <span class="event-value">{{ search.term() || '-' }}</span>
    </div>
  </div>`,
};
