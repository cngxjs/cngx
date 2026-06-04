import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActiveDescendant: Listbox with items input',
  subtitle: 'Focus stays on the container. Arrow keys, Home/End, Enter/Space and typeahead all navigate via <code>aria-activedescendant</code>. Disabled items are skipped.',
  description: 'Drives the active item from an <code>[items]</code> signal, auto-highlights the first entry via <code>[autoHighlightFirst]</code>, and emits the activated item through <code>(activated)</code>. The host stays focused; the option DOM is rendered by the consumer.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxActiveDescendant',
  ],
  moduleImports: [
    'import { CngxActiveDescendant, type ActiveDescendantItem } from \'@cngx/common/a11y\';',
  ],
  imports: ['CngxActiveDescendant'],
  references: [
    {
      label: 'WAI-ARIA APG: Listbox pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
    },
    {
      label: 'WAI-ARIA APG: aria-activedescendant focus model',
      href: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_activedescendant',
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
  protected readonly lastActivated = signal<string | null>(null);`,
  template: `  <div class="cngx-ad-listbox"
       style="max-width:260px"
       cngxActiveDescendant
       role="listbox"
       aria-label="Fruits"
       tabindex="0"
       [items]="fruits()"
       [autoHighlightFirst]="true"
       (activated)="lastActivated.set($any($event))"
       #ad="cngxActiveDescendant">
    @for (fruit of fruits(); track fruit.id) {
      <div role="option"
           [id]="fruit.id"
           [attr.aria-selected]="ad.activeId() === fruit.id"
           [attr.aria-disabled]="fruit.disabled || null"
           [class.cngx-option--highlighted]="ad.activeId() === fruit.id"
           [class.cngx-option--disabled]="fruit.disabled"
           class="cngx-ad-option">
        {{ fruit.label }}
      </div>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
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
};
