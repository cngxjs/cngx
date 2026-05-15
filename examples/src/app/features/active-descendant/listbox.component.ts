import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CngxActiveDescendant, type ActiveDescendantItem } from '@cngx/common/a11y';

@Component({
  selector: 'app-active-descendant-listbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxActiveDescendant],
  template: `
    <div cngxActiveDescendant
         role="listbox"
         aria-label="Fruits"
         tabindex="0"
         [items]="fruits()"
         [autoHighlightFirst]="true"
         (activated)="handleActivated($event)"
         #ad="cngxActiveDescendant">
      @for (fruit of fruits(); track fruit.id) {
        <div role="option"
             [id]="fruit.id"
             [attr.aria-selected]="ad.activeId() === fruit.id"
             [attr.aria-disabled]="fruit.disabled || null">
          {{ fruit.label }}
        </div>
      }
    </div>
    <dl>
      <dt>Active id</dt><dd>{{ ad.activeId() ?? '—' }}</dd>
      <dt>Active value</dt><dd>{{ ad.activeValue() ?? '—' }}</dd>
      <dt>Last activated</dt><dd>{{ lastActivated() ?? '—' }}</dd>
    </dl>
  `,
})
export class ActiveDescendantListbox {
  protected readonly fruits = signal<ActiveDescendantItem[]>([
    { id: 'fruit-apple', value: 'apple', label: 'Apple' },
    { id: 'fruit-banana', value: 'banana', label: 'Banana' },
    { id: 'fruit-cherry', value: 'cherry', label: 'Cherry' },
    { id: 'fruit-date', value: 'date', label: 'Date', disabled: true },
    { id: 'fruit-elder', value: 'elder', label: 'Elderberry' },
    { id: 'fruit-fig', value: 'fig', label: 'Fig' },
  ]);
  protected readonly lastActivated = signal<string | null>(null);

  protected handleActivated(value: unknown): void {
    this.lastActivated.set(typeof value === 'string' ? value : String(value));
  }
}
