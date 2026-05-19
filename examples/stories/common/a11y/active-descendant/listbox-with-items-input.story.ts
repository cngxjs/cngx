import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Listbox with items input',
  subtitle: 'Focus stays on the container. Arrow keys, Home/End, Enter/Space and typeahead all navigate via <code>aria-activedescendant</code>. Disabled items are skipped.',
  description: 'WAI-ARIA active-descendant keyboard model for listbox, menu, and combobox widgets. Keeps focus on the host while highlighting the logical current item.',
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
  setup: `protected readonly fruits = signal<ActiveDescendantItem[]>([
    { id: 'fruit-apple', value: 'apple', label: 'Apple' },
    { id: 'fruit-banana', value: 'banana', label: 'Banana' },
    { id: 'fruit-cherry', value: 'cherry', label: 'Cherry' },
    { id: 'fruit-date', value: 'date', label: 'Date', disabled: true },
    { id: 'fruit-elder', value: 'elder', label: 'Elderberry' },
    { id: 'fruit-fig', value: 'fig', label: 'Fig' },
  ]);
  protected readonly lastActivated = signal<string | null>(null);`,
  template: `
  <div class="cngx-ad-listbox"
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
  border: 1px solid var(--cngx-color-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 8px);
  background: var(--cngx-color-surface, #ffffff);
  outline: none;
}
.ad-listbox:focus-visible {
  outline: 2px solid var(--cngx-color-primary, #4a8cff);
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
};
