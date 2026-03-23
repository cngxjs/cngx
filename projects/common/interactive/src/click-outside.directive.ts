import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { fromEvent, switchMap } from 'rxjs';

/**
 * Emits when the user interacts outside the host element.
 *
 * Listens for a configurable DOM event on the document and checks whether
 * the event target is outside the host element's subtree. Useful for closing
 * dropdowns, popovers, modals, and any overlay that should dismiss on
 * outside interaction.
 *
 * The event type defaults to `'pointerdown'` which covers mouse, touch, and
 * pen input. Change it via the `[eventType]` input.
 *
 * @usageNotes
 *
 * ### Dropdown dismiss
 * ```html
 * <div cngxClickOutside (clickOutside)="closeDropdown()" [enabled]="isOpen()">
 *   <ul>…menu items…</ul>
 * </div>
 * ```
 *
 * ### With custom event type
 * ```html
 * <div cngxClickOutside [eventType]="'click'" (clickOutside)="dismiss()">…</div>
 * ```
 */
@Directive({
  selector: '[cngxClickOutside]',
  exportAs: 'cngxClickOutside',
  standalone: true,
})
export class CngxClickOutside {
  /** The DOM event type to listen for. `'pointerdown'` covers both mouse and touch. */
  readonly eventType = input<'pointerdown' | 'click' | 'mousedown' | 'touchstart'>('pointerdown');
  /** When `false` the directive is disabled and no events are emitted. */
  readonly enabled = input<boolean>(true);
  /** Emitted when the user interacts outside the host element. */
  readonly clickOutside = output<PointerEvent | MouseEvent | TouchEvent>();

  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _doc = inject(DOCUMENT);

  constructor() {
    toObservable(this.eventType)
      .pipe(
        switchMap((type) => fromEvent<PointerEvent | MouseEvent | TouchEvent>(this._doc, type)),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (this.enabled() && !(this._el.nativeElement as HTMLElement).contains(e.target as Node)) {
          this.clickOutside.emit(e);
        }
      });
  }
}
