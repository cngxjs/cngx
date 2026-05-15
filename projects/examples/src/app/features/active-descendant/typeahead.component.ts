import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CngxActiveDescendant, type ActiveDescendantItem } from '@cngx/common/a11y';

@Component({
  selector: 'app-active-descendant-typeahead',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxActiveDescendant],
  template: `
    <div cngxActiveDescendant
         role="listbox"
         aria-label="Fruit typeahead"
         tabindex="0"
         [items]="items()"
         [typeaheadDebounce]="500"
         #ad="cngxActiveDescendant">
      @for (fruit of items(); track fruit.id) {
        <div role="option"
             [id]="fruit.id">
          {{ fruit.label }}
        </div>
      }
    </div>
    <dl>
      <dt>Active id</dt><dd>{{ ad.activeId() ?? '—' }}</dd>
      <dt>Active value</dt><dd>{{ ad.activeValue() ?? '—' }}</dd>
    </dl>
    <p>Focus the listbox, then type <kbd>c</kbd><kbd>h</kbd> to land on Cherry, or <kbd>e</kbd> for Elderberry.</p>
  `,
})
export class ActiveDescendantTypeahead {
  private readonly fruits = signal<ActiveDescendantItem[]>([
    { id: 'fruit-apple', value: 'apple', label: 'Apple' },
    { id: 'fruit-banana', value: 'banana', label: 'Banana' },
    { id: 'fruit-cherry', value: 'cherry', label: 'Cherry' },
    { id: 'fruit-date', value: 'date', label: 'Date', disabled: true },
    { id: 'fruit-elder', value: 'elder', label: 'Elderberry' },
    { id: 'fruit-fig', value: 'fig', label: 'Fig' },
  ]);
  protected readonly items = computed<ActiveDescendantItem[]>(() =>
    this.fruits().map((f) => ({ ...f, id: f.id + '-ta' })),
  );
}
