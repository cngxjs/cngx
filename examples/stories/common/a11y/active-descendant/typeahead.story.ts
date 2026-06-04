import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActiveDescendant: Typeahead',
  subtitle:
    'Press letters to jump to the first matching label. Chained within the debounce window (default 300&nbsp;ms).',
  description:
    'Demonstrates the built-in typeahead search inside <code>cngxActiveDescendant</code>: keystrokes within the debounce window accumulate into a prefix, and the directive activates the first matching label without leaving the host.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxActiveDescendant'],
  moduleImports: [
    "import { CngxActiveDescendant, type ActiveDescendantItem } from '@cngx/common/a11y';",
  ],
  imports: ['CngxActiveDescendant'],
  references: [
    {
      label: 'WAI-ARIA APG: Listbox keyboard typeahead',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboardinteraction',
    },
  ],
  setup: `protected readonly fruits = signal<ActiveDescendantItem[]>([
    { id: 'fruit-apple', value: 'apple', label: 'Apple' },
    { id: 'fruit-banana', value: 'banana', label: 'Banana' },
    { id: 'fruit-cherry', value: 'cherry', label: 'Cherry' },
    { id: 'fruit-date', value: 'date', label: 'Date', disabled: true },
    { id: 'fruit-elder', value: 'elder', label: 'Elderberry' },
    { id: 'fruit-fig', value: 'fig', label: 'Fig' },
  ]);
  protected readonly typeaheadFruits = computed(() =>
    this.fruits().map((f): ActiveDescendantItem => ({ ...f, id: f.id + '-ta' })),
  );`,
  template: `  <div class="cngx-ad-listbox"
       style="max-width:260px"
       cngxActiveDescendant
       role="listbox"
       aria-label="Fruit typeahead"
       tabindex="0"
       [items]="typeaheadFruits()"
       #adT="cngxActiveDescendant">
    @for (fruit of typeaheadFruits(); track fruit.id) {
      <div role="option"
           [id]="fruit.id"
           [class.cngx-option--highlighted]="adT.activeIndex() === $index"
           class="cngx-ad-option">
        {{ fruit.label }}
      </div>
    }
  </div>`,
  templateChromeBefore: `<p>
    Click the listbox to focus it, then type <kbd>c</kbd><kbd>h</kbd> quickly to land on Cherry, or <kbd>e</kbd> to land on Elderberry.
  </p>`,
  templateChrome: `<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Active id</span>
      <span class="event-value">{{ adT.activeId() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Active value</span>
      <span class="event-value">{{ adT.activeValue() ?? '—' }}</span>
    </div>
  </div>`,
};
