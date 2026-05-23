import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSearch: APG combobox typeahead',
  subtitle: 'Compose <code>cngxSearch</code> with the WAI-ARIA editable-combobox / list-autocomplete pattern. Debounced filter on input; arrow keys navigate matches via <code>aria-activedescendant</code>; <kbd>Enter</kbd> selects; <kbd>Escape</kbd> clears.',
  description: '<code>CngxSearch</code> ships no aria surface of its own - it converts the DOM input stream into a debounced <code>term()</code> Signal and stops there. Every aria attribute and keyboard binding below is consumer-owned, which is exactly what the APG list-autocomplete pattern needs: <code>role="combobox"</code> on the input, <code>aria-controls</code> pointing at the popup, <code>aria-expanded</code> reflecting popup visibility, <code>aria-activedescendant</code> moving the virtual cursor without ever shifting DOM focus off the input. A local <code>activeIndex</code> signal tracks the highlight; <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd> / <kbd>Home</kbd> / <kbd>End</kbd> navigate the matches, <kbd>Enter</kbd> commits, <kbd>Escape</kbd> clears the highlight first, then the term. A polite <code>role="status"</code> live region announces the match count so screen reader users get the same feedback sighted users get from the shrinking list.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxSearch',
  ],
  moduleImports: [
    'import { CngxSearch } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxSearch'],
  references: [
    { label: 'WAI-ARIA APG: Editable Combobox With List Autocomplete', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/' },
    { label: 'WCAG 2.1 SC 4.1.3 Status Messages', href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html' },
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  setup: `
  protected readonly fruits = [
    'Apple', 'Apricot', 'Avocado',
    'Banana', 'Blackberry', 'Blueberry',
    'Cherry', 'Coconut',
    'Date', 'Dragonfruit',
    'Fig', 'Grape', 'Grapefruit',
    'Kiwi', 'Lemon', 'Lime', 'Lychee',
    'Mango', 'Melon',
    'Orange', 'Papaya', 'Peach', 'Pear', 'Pineapple', 'Plum',
    'Raspberry', 'Strawberry', 'Tangerine', 'Watermelon',
  ] as const;

  protected readonly term = signal<string>('');
  protected readonly activeIndex = signal<number>(-1);
  protected readonly selected = signal<string | null>(null);

  protected readonly filtered = computed<readonly string[]>(() => {
    const q = this.term().trim().toLowerCase();
    if (q.length === 0) return this.fruits;
    return this.fruits.filter((f) => f.toLowerCase().includes(q));
  });

  protected readonly expanded = computed<boolean>(() => this.term().length > 0);

  protected readonly activeId = computed<string | null>(() => {
    const i = this.activeIndex();
    const list = this.filtered();
    if (i < 0 || i >= list.length) return null;
    return 'fruit-opt-' + i;
  });

  protected readonly statusMessage = computed<string>(() => {
    if (this.term().length === 0) return '';
    const total = this.filtered().length;
    if (total === 0) return 'No matches.';
    return total + (total === 1 ? ' match' : ' matches') + '.';
  });

  protected handleSearchChange(value: string): void {
    this.term.set(value);
    this.activeIndex.set(-1);
  }

  protected handleKeydown(event: KeyboardEvent, search: CngxSearch): void {
    const list = this.filtered();
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (list.length === 0) return;
        const next = this.activeIndex() < 0 ? 0 : Math.min(this.activeIndex() + 1, list.length - 1);
        this.activeIndex.set(next);
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (list.length === 0) return;
        const next = this.activeIndex() <= 0 ? 0 : this.activeIndex() - 1;
        this.activeIndex.set(next);
        return;
      }
      case 'Home':
        if (list.length === 0) return;
        event.preventDefault();
        this.activeIndex.set(0);
        return;
      case 'End':
        if (list.length === 0) return;
        event.preventDefault();
        this.activeIndex.set(list.length - 1);
        return;
      case 'Enter':
        if (this.activeIndex() >= 0 && this.activeIndex() < list.length) {
          event.preventDefault();
          this.commit(list[this.activeIndex()], search);
        }
        return;
      case 'Escape':
        event.preventDefault();
        if (this.activeIndex() >= 0) {
          this.activeIndex.set(-1);
        } else if (this.term().length > 0) {
          search.clear();
        }
        return;
    }
  }

  protected commit(value: string, search: CngxSearch): void {
    this.selected.set(value);
    search.clear();
  }`,
  template: `
  <div style="display:flex; flex-direction:column; gap:8px; max-width:24rem">
    <label for="fruit-combobox">Search fruits</label>
    <input
      id="fruit-combobox"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      aria-controls="fruit-listbox"
      [attr.aria-expanded]="expanded()"
      [attr.aria-activedescendant]="activeId()"
      cngxSearch
      #s="cngxSearch"
      (searchChange)="handleSearchChange($event)"
      (keydown)="handleKeydown($event, s)"
      placeholder="Type to filter..."
    />
    <ul
      id="fruit-listbox"
      role="listbox"
      aria-label="Fruit matches"
      class="demo-typeahead-listbox"
      [hidden]="!expanded()"
    >
      @for (fruit of filtered(); track fruit; let i = $index) {
        <li
          role="option"
          class="demo-typeahead-option"
          [id]="'fruit-opt-' + i"
          [attr.aria-selected]="activeIndex() === i"
          (mousedown)="$event.preventDefault(); commit(fruit, s)"
        >{{ fruit }}</li>
      } @empty {
        <li role="presentation" class="demo-typeahead-empty">No matches.</li>
      }
    </ul>
    <div role="status" aria-live="polite" class="demo-sr-only">{{ statusMessage() }}</div>
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">term()</span>
      <span class="event-value">{{ s.term() || '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">activeIndex</span>
      <span class="event-value">{{ activeIndex() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">activeId</span>
      <span class="event-value">{{ activeId() || '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">aria-expanded</span>
      <span class="event-value">{{ expanded() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">matches</span>
      <span class="event-value">{{ filtered().length }} of {{ fruits.length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">selected</span>
      <span class="event-value">{{ selected() || '-' }}</span>
    </div>
  </div>`,
};
