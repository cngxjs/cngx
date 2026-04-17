import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Listbox Search',
  navLabel: 'ListboxSearch',
  navCategory: 'interactive',
  description:
    'Search input that drives a sibling CngxListbox. Term is debounced via the underlying CngxSearch hostDirective; listboxes read term + matchFn reactively.',
  apiComponents: ['CngxListboxSearch', 'CngxListbox', 'CngxOption'],
  overview:
    '<p><code>input[cngxListboxSearch]</code> wraps <code>CngxSearch</code> and adds a <code>matchFn</code>. ' +
    'A <code>CngxListbox</code> nested inside the same view injects the search directive and exposes <code>filteredOptions</code> + <code>hasSearchResults</code>.</p>',
  moduleImports: [
    "import { CngxListbox, CngxListboxSearch, CngxOption } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly commands = signal<Array<{ value: string; label: string }>>([
    { value: 'open-file', label: 'Open file…' },
    { value: 'open-folder', label: 'Open folder…' },
    { value: 'save', label: 'Save' },
    { value: 'save-as', label: 'Save as…' },
    { value: 'close', label: 'Close' },
    { value: 'reload', label: 'Reload' },
  ]);
  protected readonly lastSelected = signal<string | null>(null);
  `,
  sections: [
    {
      title: 'Command palette',
      subtitle:
        'Type to filter; the listbox shows only matching options. <code>hasSearchResults</code> drives the empty state.',
      imports: ['CngxListbox', 'CngxListboxSearch', 'CngxOption'],
      template: `
  <input
    cngxListboxSearch
    class="palette-search"
    type="search"
    placeholder="Search commands…"
    aria-label="Search commands"
    #search="cngxListboxSearch"
  />
  <div
    cngxListbox
    [label]="'Palette'"
    [cngxSearchRef]="search"
    class="ad-listbox"
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
  @if (palette.options().length === 0) {
    <p class="empty">No matching commands.</p>
  }
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Last selected</span>
      <span class="event-value">{{ lastSelected() ?? '—' }}</span>
    </div>
  </div>`,
      css: `.palette-search {
  width: 260px;
  padding: 6px 10px;
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 8px);
  font: inherit;
}
.ad-listbox {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 260px;
  max-height: 260px;
  overflow: auto;
  padding: 4px;
  margin-top: 8px;
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 8px);
  outline: none;
}
.ad-listbox:focus-visible {
  outline: 2px solid var(--cngx-focus-ring, #4a8cff);
  outline-offset: 2px;
}
.ad-listbox [cngxOption] {
  padding: 6px 10px;
  border-radius: var(--cngx-radius-sm, 4px);
}
.cngx-option--highlighted {
  background: var(--cngx-option-highlight-bg, rgba(74, 140, 255, 0.15));
}
.cngx-option--selected {
  background: var(--cngx-option-selected-bg, rgba(74, 140, 255, 0.25));
}
.empty {
  margin: 6px 0 0;
  padding: 6px 10px;
  color: var(--cngx-text-muted, #6b7280);
  font-size: 0.875rem;
}`,
    },
  ],
};
