import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxListboxSearch: inline search-within-view',
  subtitle:
    'Focus the input to open the popover, then type to filter a local list in place. Arrows navigate, Enter picks, Escape closes; typing (incl. Space) reaches the input. No form value, no command registry - just CngxSearch + CngxListbox + CngxPopover composed.',
  description:
    'The search-within-view recipe: what you reach for instead of a command palette when the goal is filtering the current view, not running actions. A composed pattern, not a component - CngxListboxSearch drives the debounced term, the listbox reads it via [cngxSearchRef], and CngxPopover owns open/close under the input. The command-palette organism lives at /ui/command-palette/basic.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Combobox pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
    },
  ],
  apiComponents: ['CngxListboxSearch', 'CngxListbox', 'CngxOption', 'CngxPopover'],
  moduleImports: [
    "import { CngxListbox, CngxListboxSearch, CngxListboxTrigger, CngxOption } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxListbox',
    'CngxListboxSearch',
    'CngxListboxTrigger',
    'CngxOption',
    'CngxPopover',
    'CngxPopoverTrigger',
  ],
  setup: `protected readonly fruits = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Mango', 'Orange', 'Peach', 'Pear'];
  protected readonly picked = signal<string | null>(null);`,
  template: `  <input
    type="search"
    class="demo-listbox-search"
    cngxListboxSearch
    [cngxListboxTrigger]="lb"
    [cngxPopoverTrigger]="pop"
    [haspopup]="'listbox'"
    [popover]="pop"
    placeholder="Filter fruit..."
    aria-label="Filter fruit"
    aria-controls="inline-filter-list"
    (focus)="pop.show()"
    #search="cngxListboxSearch"
    #trigger="cngxListboxTrigger"
  />
  <div cngxPopover #pop="cngxPopover">
    <div
      cngxListbox
      id="inline-filter-list"
      class="demo-listbox-surface demo-listbox-surface--scroll"
      [label]="'Fruit'"
      [cngxSearchRef]="search"
      tabindex="0"
      (valueChange)="picked.set($any($event))"
      #lb="cngxListbox"
    >
      @let term = search.term().toLowerCase();
      @for (fruit of fruits; track fruit) {
        @if (!term || fruit.toLowerCase().includes(term)) {
          <div cngxOption [value]="fruit" [label]="fruit">{{ fruit }}</div>
        }
      }
    </div>
    @if (!lb.hasSearchResults()) {
      <p class="demo-listbox-empty">No matches.</p>
    }
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Picked</span>
      <span class="event-value">{{ picked() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Term</span>
      <span class="event-value">{{ search.term() || '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Open</span>
      <span class="event-value">{{ trigger.isOpen() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
