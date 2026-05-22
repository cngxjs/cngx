import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSearch: Typeahead filter',
  subtitle: 'Apply <code>cngxSearch</code> to an <code>&lt;input&gt;</code>, expose it via <code>#search="cngxSearch"</code>, and bind <code>search.term()</code> into a <code>computed()</code> filter.',
  description: 'Debounced search-term tracker for native <code>&lt;input&gt;</code> elements. Converts the DOM <code>input</code> event stream into a debounced <code>Signal</code> via <code>fromEvent</code> + <code>timer</code> internally, but never exposes the raw Observable - <code>term()</code> is the Signal-at-the-API-boundary readout. Default debounce is 300 ms; override with <code>[debounceMs]</code> when the host has tighter latency requirements (toolbar filter) or looser (server-call autocomplete). <code>hasValue()</code> is a derived computed for clear-button visibility; <code>clear()</code> resets both the signal and the DOM input value via <code>Renderer2</code>. The example below filters a static fruit list by substring; the same shape applies to any signal-driven projection downstream of the search term.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxSearch',
  ],
  moduleImports: [
    'import { CngxSearch } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxSearch'],
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

  protected readonly filtered = computed<readonly string[]>(() => {
    const q = this.term().trim().toLowerCase();
    if (q.length === 0) return this.fruits;
    return this.fruits.filter((f) => f.toLowerCase().includes(q));
  });

  protected handleSearchChange(value: string): void {
    this.term.set(value);
  }`,
  template: `
  <div style="display:flex; flex-direction:column; gap:8px; max-width:24rem">
    <label for="search-input">Search fruits</label>
    <input
      id="search-input"
      type="search"
      cngxSearch
      #search="cngxSearch"
      (searchChange)="handleSearchChange($event)"
      placeholder="Type to filter..."
    />
    @if (search.hasValue()) {
      <button type="button" (click)="search.clear(); term.set('')" style="align-self:flex-start">Clear</button>
    }
    <ul role="list" style="display:flex; flex-direction:column; gap:2px; list-style:none; padding:0; margin:0">
      @for (fruit of filtered(); track fruit) {
        <li>{{ fruit }}</li>
      } @empty {
        <li>No matches.</li>
      }
    </ul>
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">term()</span>
      <span class="event-value">{{ search.term() || '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">hasValue()</span>
      <span class="event-value">{{ search.hasValue() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">matches</span>
      <span class="event-value">{{ filtered().length }} of {{ fruits.length }}</span>
    </div>
  </div>`,
};
