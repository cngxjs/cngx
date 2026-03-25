import { DOCUMENT } from '@angular/common';
import { Directive, effect, inject, input, output, signal } from '@angular/core';

/**
 * Tracks which section is currently most visible in the viewport.
 *
 * Observes a list of elements by their IDs using `IntersectionObserver`
 * and reports the one with the highest intersection ratio as the active section.
 * Ideal for scroll-based navigation highlighting and reading progress.
 *
 * @usageNotes
 *
 * ### Navigation highlighting
 * ```html
 * <nav [cngxScrollSpy]="['intro', 'features', 'pricing']"
 *      #spy="cngxScrollSpy">
 *   <a [class.active]="spy.activeId() === 'intro'" href="#intro">Intro</a>
 *   <a [class.active]="spy.activeId() === 'features'" href="#features">Features</a>
 *   <a [class.active]="spy.activeId() === 'pricing'" href="#pricing">Pricing</a>
 * </nav>
 *
 * <section id="intro">…</section>
 * <section id="features">…</section>
 * <section id="pricing">…</section>
 * ```
 *
 * @category layout
 */
@Directive({
  selector: '[cngxScrollSpy]',
  exportAs: 'cngxScrollSpy',
  standalone: true,
})
export class CngxScrollSpy {
  /** IDs of the sections to observe. */
  readonly sections = input.required<string[]>({ alias: 'cngxScrollSpy' });
  /** Minimum visibility ratio to consider a section as a candidate. */
  readonly threshold = input<number>(0.3);
  /** CSS selector for the scroll container root. `null` uses the viewport. */
  readonly root = input<string | null>(null);
  /** Root margin for the observer. */
  readonly rootMargin = input<string>('0px');

  /** Emitted when the active section changes. */
  readonly activeIdChange = output<string | null>();

  private readonly activeIdState = signal<string | null>(null);
  /** ID of the section with the highest intersection ratio. */
  readonly activeId = this.activeIdState.asReadonly();

  private readonly doc = inject(DOCUMENT);
  /** Running map of section ID → last observed intersection ratio. */
  private readonly ratios = new Map<string, number>();

  constructor() {
    effect((onCleanup) => {
      const ids = this.sections();
      const thresholdValue = this.threshold();
      const rootSelector = this.root();
      const rootMarginValue = this.rootMargin();

      this.ratios.clear();

      const elements = ids
        .map((id) => this.doc.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

      if (elements.length === 0) {
        return;
      }

      const resolvedRoot = rootSelector ? this.doc.querySelector(rootSelector) : null;

      // Use fine-grained thresholds (0..1 in 0.1 steps) to get accurate ratios.
      // The callback fires for each threshold crossing, updating the ratio map.
      // The section with the highest ratio above the minimum threshold wins.
      const observer = new IntersectionObserver(
        (entries) => {
          // Update ratio map with latest observations
          for (const entry of entries) {
            this.ratios.set(entry.target.id, entry.intersectionRatio);
          }

          // Find the most-visible section that meets the minimum threshold
          let bestId: string | null = null;
          let bestRatio = 0;

          for (const [id, ratio] of this.ratios) {
            if (ratio >= thresholdValue && ratio > bestRatio) {
              bestRatio = ratio;
              bestId = id;
            }
          }

          if (bestId !== this.activeIdState()) {
            this.activeIdState.set(bestId);
            this.activeIdChange.emit(bestId);
          }
        },
        {
          root: resolvedRoot,
          rootMargin: rootMarginValue,
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        },
      );

      for (const el of elements) {
        observer.observe(el);
      }

      onCleanup(() => observer.disconnect());
    });
  }
}
