import {
  afterRenderEffect,
  computed,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  type Signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { chipFitSnapshotEqual, type ChipFitSnapshot } from './chip-fit';

/**
 * Marks one chip slot of a `'fit'` strip for {@link CngxSelectChipFitStrip}.
 *
 * @internal
 */
@Directive({
  selector: '[cngxSelectChipFitSlot]',
  standalone: true,
})
export class CngxSelectChipFitSlot {
  /** The slot element the strip measures. */
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
}

/**
 * Measures a `'fit'` chip strip: content-box inline size, `column-gap`, the
 * badge reserve (`--_cngx-chip-fit-reserve`, px) and every slot width in DOM
 * order, as one {@link ChipFitSnapshot}.
 *
 * One native `ResizeObserver` watches the host and every slot while
 * `active()`; an `afterRenderEffect` re-reads after a slot-list change, so a
 * selection change is measured before paint. Every measured value depends on
 * the strip alone, so the fit result never feeds back into a measurement.
 *
 * @internal
 */
@Directive({
  selector: '[cngxSelectChipFitStrip]',
  standalone: true,
  exportAs: 'cngxSelectChipFitStrip',
})
export class CngxSelectChipFitStrip {
  /** Whether the strip runs in `'fit'` and should be measured. */
  readonly active = input<boolean>(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly win = inject(DOCUMENT).defaultView;
  private readonly slots = contentChildren(CngxSelectChipFitSlot, { descendants: true });
  private readonly snapshotState = signal<ChipFitSnapshot | null>(null, {
    equal: chipFitSnapshotEqual,
  });
  private readonly observer: ResizeObserver | null =
    this.win && typeof this.win.ResizeObserver === 'function'
      ? new this.win.ResizeObserver(() => this.read())
      : null;

  /** The latest measurement; `null` while inactive or before the first read. */
  readonly snapshot = computed(() => (this.active() ? this.snapshotState() : null));

  constructor() {
    effect((onCleanup) => {
      const observer = this.observer;
      if (!observer || !this.active()) {
        return;
      }
      observer.observe(this.host.nativeElement);
      for (const slot of this.slots()) {
        observer.observe(slot.elementRef.nativeElement);
      }
      onCleanup(() => observer.disconnect());
    });

    afterRenderEffect({
      read: () => {
        this.slots();
        if (this.active()) {
          this.read();
        }
      },
    });
  }

  /** Whether a slot at `index` or later holds the focused element. */
  hasFocusFrom(index: number): boolean {
    const focused = this.host.nativeElement.ownerDocument.activeElement;
    if (!focused) {
      return false;
    }
    return this.slots()
      .slice(index)
      .some((slot) => slot.elementRef.nativeElement.contains(focused));
  }

  private read(): void {
    if (!this.win || !this.active()) {
      return;
    }
    const strip = this.host.nativeElement;
    const style = this.win.getComputedStyle(strip);
    const available =
      strip.getBoundingClientRect().width -
      px(style.borderInlineStartWidth) -
      px(style.borderInlineEndWidth) -
      px(style.paddingInlineStart) -
      px(style.paddingInlineEnd);
    // A strip without layout (display: none, detached) has nothing to fit.
    if (!(available > 0)) {
      return;
    }
    this.snapshotState.set({
      available,
      gap: px(style.columnGap),
      reserve: px(style.getPropertyValue('--_cngx-chip-fit-reserve')),
      widths: this.slots().map((slot) => slot.elementRef.nativeElement.getBoundingClientRect().width),
    });
  }
}

function px(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Moves focus to `target` when a narrowing hides the slot that holds it, so
 * focus never falls to `body` once the slot turns `inert`. The effect runs
 * before the view applies the hidden state, while the slot still has focus.
 * Call in an injection context.
 *
 * @internal
 */
export function handOffChipFitFocus(opts: {
  readonly strip: Signal<CngxSelectChipFitStrip | undefined>;
  readonly visibleCount: Signal<number>;
  readonly target: () => HTMLElement | null | undefined;
}): void {
  effect(() => {
    const strip = opts.strip();
    const from = opts.visibleCount();
    if (!strip?.active()) {
      return;
    }
    untracked(() => {
      if (strip.hasFocusFrom(from)) {
        opts.target()?.focus();
      }
    });
  });
}
