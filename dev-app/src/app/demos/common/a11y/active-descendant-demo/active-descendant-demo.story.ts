import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Active Descendant',
  navLabel: 'ActiveDescendant',
  navCategory: 'a11y',
  description:
    'WAI-ARIA active-descendant keyboard model for listbox, menu, and combobox widgets. Keeps focus on the host while highlighting the logical current item.',
  apiComponents: ['CngxActiveDescendant'],
  overview:
    '<p><code>[cngxActiveDescendant]</code> is the counterpart to <code>CngxRovingTabindex</code> ' +
    'for composite widgets where focus stays on a single container and the currently active option is ' +
    'communicated via <code>aria-activedescendant</code>. Works for listboxes, menus, and combobox inputs.</p>' +
    '<p><strong>Why better than Material:</strong> signal-first state (every ARIA attribute is a ' +
    '<code>computed()</code>), unified model across listbox/menu/combobox, debounceable typeahead, ' +
    'virtualization-aware via <code>pendingHighlight</code>.</p>',
  moduleImports: [
    "import { CngxActiveDescendant, type ActiveDescendantItem } from '@cngx/common/a11y';",
  ],
  setup: `
  protected readonly fruits = signal<ActiveDescendantItem[]>([
    { id: 'fruit-apple', value: 'apple', label: 'Apple' },
    { id: 'fruit-banana', value: 'banana', label: 'Banana' },
    { id: 'fruit-cherry', value: 'cherry', label: 'Cherry' },
    { id: 'fruit-date', value: 'date', label: 'Date', disabled: true },
    { id: 'fruit-elder', value: 'elder', label: 'Elderberry' },
    { id: 'fruit-fig', value: 'fig', label: 'Fig' },
  ]);
  protected readonly typeaheadFruits = computed(() =>
    this.fruits().map((f): ActiveDescendantItem => ({ ...f, id: f.id + '-ta' })),
  );
  protected readonly lastActivated = signal<string | null>(null);
  `,
  sections: [
    {
      title: 'Listbox with items input',
      subtitle:
        'Focus stays on the container. Arrow keys, Home/End, Enter/Space and typeahead all navigate via <code>aria-activedescendant</code>. Disabled items are skipped.',
      imports: ['CngxActiveDescendant'],
      template: `
  <div class="ad-listbox"
       cngxActiveDescendant
       role="listbox"
       aria-label="Fruits"
       tabindex="0"
       [items]="fruits()"
       autoHighlightFirst="true"
       (activated)="lastActivated.set($any($event))"
       #ad="cngxActiveDescendant">
    @for (fruit of fruits(); track fruit.id) {
      <div role="option"
           [id]="fruit.id"
           [attr.aria-selected]="ad.activeId() === fruit.id"
           [attr.aria-disabled]="fruit.disabled || null"
           [class.ad-option--active]="ad.activeId() === fruit.id"
           [class.ad-option--disabled]="fruit.disabled">
        {{ fruit.label }}
      </div>
    }
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active id</span>
      <span class="event-value">{{ ad.activeId() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Active value</span>
      <span class="event-value">{{ ad.activeValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last activated</span>
      <span class="event-value">{{ lastActivated() ?? '—' }}</span>
    </div>
  </div>`,
      css: `.ad-listbox {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 260px;
  padding: 4px;
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 8px);
  background: var(--cngx-surface-default, #ffffff);
  outline: none;
}
.ad-listbox:focus-visible {
  outline: 2px solid var(--cngx-focus-ring, #4a8cff);
  outline-offset: 2px;
}
.ad-listbox [role="option"] {
  padding: 6px 10px;
  border-radius: var(--cngx-radius-sm, 4px);
  cursor: default;
  user-select: none;
}
.ad-option--active {
  background: var(--cngx-ad-highlight-bg, rgba(74, 140, 255, 0.15));
}
.ad-option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}`,
    },
    {
      title: 'Typeahead',
      subtitle:
        'Press letters to jump to the first matching label. Chained within the debounce window (default 300&nbsp;ms).',
      imports: ['CngxActiveDescendant'],
      template: `
  <div class="ad-listbox"
       cngxActiveDescendant
       role="listbox"
       aria-label="Fruit typeahead"
       tabindex="0"
       [items]="typeaheadFruits()"
       [typeaheadDebounce]="500"
       #adT="cngxActiveDescendant">
    @for (fruit of typeaheadFruits(); track fruit.id) {
      <div role="option"
           [id]="fruit.id"
           [class.ad-option--active]="adT.activeIndex() === $index">
        {{ fruit.label }}
      </div>
    }
  </div>
  <p style="margin-top:8px;font-size:0.875rem;color:var(--cngx-text-muted,#6b7280)">
    Try typing <kbd>c</kbd><kbd>h</kbd> quickly to land on Cherry, or <kbd>e</kbd> to land on Elderberry.
  </p>`,
    },
  ],
};
