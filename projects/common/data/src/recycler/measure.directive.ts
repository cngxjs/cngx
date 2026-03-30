// Phase 2: measure.directive.ts — CngxMeasure atom

import { Directive, ElementRef, effect, inject, input } from '@angular/core';

import type { CngxRecycler } from './recycler';

/**
 * Atom directive that measures the host element's height and reports it
 * to the recycler via `recycler.measure(index, element)`.
 *
 * Uses `ResizeObserver` to detect height changes (e.g. content expansion,
 * font loading). Cleanup is automatic via `DestroyRef`.
 *
 * Also sets `data-cngx-recycle-index` on the host element for focus tracking.
 *
 * @usageNotes
 *
 * ```html
 * @for (item of visibleItems(); track item.id; let i = $index) {
 *   <div [cngxMeasure]="recycler" [cngxMeasureIndex]="recycler.start() + i">
 *     {{ item.content }}
 *   </div>
 * }
 * ```
 *
 * @category recycler
 */
@Directive({
  selector: '[cngxMeasure]',
  standalone: true,
  host: {
    '[attr.data-cngx-recycle-index]': 'cngxMeasureIndex()',
  },
})
export class CngxMeasure {
  /** The recycler instance to report measurements to. */
  readonly cngxMeasure = input.required<CngxRecycler>();

  /** The absolute index of this item in the full dataset. */
  readonly cngxMeasureIndex = input.required<number>();

  private readonly el = inject(ElementRef<HTMLElement>);

  constructor() {
    effect((onCleanup) => {
      const recycler = this.cngxMeasure();
      const index = this.cngxMeasureIndex();
      const element = this.el.nativeElement as HTMLElement;

      // Initial measurement
      recycler.measure(index, element);

      // Observe size changes
      const observer = new ResizeObserver(() => {
        recycler.measure(index, element);
      });
      observer.observe(element);

      onCleanup(() => {
        observer.disconnect();
      });
    });
  }
}
