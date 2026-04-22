import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  isDevMode,
  output,
  signal,
  type Signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  filter,
  fromEvent,
  map,
  merge,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

/**
 * Modifier key that arms the keyboard-reorder handler. Plain arrow keys
 * keep their default meaning (focus navigation) — only the configured
 * modifier + arrow produces a move.
 *
 * @category interactive
 */
export type CngxReorderModifier = 'ctrl' | 'alt' | 'meta';

/**
 * Payload emitted by `(reordered)` whenever a pointer drag or a modifier +
 * arrow keyboard move settles on a new position.
 *
 * `next` is a fresh array — the source signal is never mutated in place,
 * so downstream `computed()` graphs see a new reference and re-evaluate.
 * Consumers own the write back to the source signal (directly, or via a
 * commit controller for optimistic / pessimistic policies).
 *
 * @category interactive
 */
export interface CngxReorderEvent<T> {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly next: readonly T[];
}

interface ActiveDrag {
  readonly pointerId: number;
  readonly fromIndex: number;
  readonly currentIndex: number;
}

/**
 * Level-2 atom that turns any flat container into a reorderable list.
 *
 * **Pointer flow.** A `pointerdown` on a drag-handle (any element matching
 * `handleSelector`) inside an item (any element matching `itemSelector`)
 * starts a drag. Pointer capture stays on the host so the gesture keeps
 * tracking when the user drifts outside the container. The drop target is
 * resolved from `document.elementFromPoint` on every `pointermove`. The
 * drag ends on `pointerup`, `pointercancel`, or a top-level `Escape`
 * press — only the first two emit `reordered`; Escape cancels the drag
 * without a mutation.
 *
 * **Keyboard flow.** When the focused element is inside an item and the
 * configured modifier + `ArrowLeft` / `ArrowRight` / `Home` / `End` is
 * pressed, the directive emits `reordered` with the new array and lets
 * the consumer re-focus the moved item (usually via `afterNextRender`).
 *
 * **Forms / commit action agnostic.** The directive never writes to the
 * source signal; it only emits events. Composers (e.g.
 * `CngxReorderableMultiSelect`) route the emission through their commit
 * controller so optimistic / pessimistic behaviour stays owned by the
 * composing component, not by this atom.
 *
 * @usageNotes
 *
 * ### Basic chip-strip reorder
 * ```html
 * <span class="chip-strip" [cngxReorder]="values" (reordered)="apply($event)">
 *   @for (v of values(); track v; let i = $index) {
 *     <span class="chip" [attr.data-reorder-index]="i">
 *       <button cngxReorderHandle aria-label="Verschieben">⋮⋮</button>
 *       {{ v.label }}
 *     </span>
 *   }
 * </span>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxReorder]',
  exportAs: 'cngxReorder',
  standalone: true,
  host: {
    '[class.cngx-reorder-container]': 'true',
    '[class.cngx-reorder-dragging]': 'dragging()',
  },
})
export class CngxReorder<T = unknown> {
  /**
   * Signal describing the current, authoritative order. The directive
   * reads it lazily at drag-start and at keyboard-move time so drag
   * sessions always resolve against the freshest value — consumers that
   * mutate the source signal during a drag (rare) still get consistent
   * results.
   */
  readonly items = input.required<Signal<readonly T[]>>({ alias: 'cngxReorder' });

  /**
   * CSS selector matched against `pointerdown` targets (via
   * `Element.closest`) to decide whether the gesture starts. Defaults
   * cover both the convention-based attribute hook
   * `[data-reorder-handle]` and the explicit semantic selector
   * `[cngxReorderHandle]` so consumers can pick whichever reads better
   * in their template.
   */
  readonly handleSelector = input<string>(
    '[cngxReorderHandle], [data-reorder-handle]',
  );

  /**
   * CSS selector matched against every reorderable child (via
   * `Element.closest`). The matched element's `data-reorder-index`
   * attribute is parsed as the `fromIndex` / `toIndex` used in the
   * emission.
   */
  readonly itemSelector = input<string>('[data-reorder-index]');

  /**
   * Optional escape-hatch selector for drag targets. When set and the
   * `pointerdown` target matches `ignoreSelector` (via `closest`), the
   * gesture is dropped — useful when the whole item is draggable but
   * interactive children (close buttons, inline edit fields, menu
   * triggers) must keep their own click semantics. Applied after
   * `handleSelector`, so the two can overlap: e.g.
   * `handleSelector = '[data-reorder-index]'` +
   * `ignoreSelector = 'button, a, [contenteditable]'` yields
   * whole-row drag with interactive child exemptions.
   *
   * `null` (default) disables the filter — the `handleSelector` alone
   * decides whether a drag starts.
   */
  readonly ignoreSelector = input<string | null>(null);

  /** Modifier key required for keyboard-driven reorder. Defaults to `'ctrl'`. */
  readonly keyboardModifier = input<CngxReorderModifier>('ctrl');

  /** Disables both pointer and keyboard flows. */
  readonly disabled = input<boolean>(false);

  /** Emitted once a drag or keyboard move settles on a new position. */
  readonly reordered = output<CngxReorderEvent<T>>();

  /** Informational — index of the item picked up by pointer drag. */
  readonly dragStart = output<number>();

  /** Informational — fires after `reordered` (or alone, if Escape cancelled). */
  readonly dragEnd = output<void>();

  private readonly activeDrag = signal<ActiveDrag | null>(null);

  /** `true` while a pointer drag is in progress. */
  readonly dragging = computed(() => this.activeDrag() !== null);

  /**
   * Index of the item currently being dragged, or `null` when no drag
   * is active. Useful for applying a `.chip--dragging` class via
   * `@for` index comparison.
   */
  readonly dragFromIndex = computed(() => this.activeDrag()?.fromIndex ?? null);

  /**
   * Index of the item the pointer is currently hovering over during a
   * drag, or `null` when no drag is active. Drives ghost-placeholder
   * positioning in the host template.
   */
  readonly dragOverIndex = computed(
    () => this.activeDrag()?.currentIndex ?? null,
  );

  private readonly hostEl = inject(ElementRef<HTMLElement>)
    .nativeElement as HTMLElement;
  private readonly doc = inject(DOCUMENT);

  constructor() {
    this.wirePointer();
    this.wireKeyboard();
    this.wireDevModeCheck();
  }

  private wirePointer(): void {
    const down$ = fromEvent<PointerEvent>(this.hostEl, 'pointerdown');
    const move$ = fromEvent<PointerEvent>(this.doc, 'pointermove');
    const up$ = fromEvent<PointerEvent>(this.doc, 'pointerup');
    const cancel$ = fromEvent<PointerEvent>(this.doc, 'pointercancel');
    const escape$ = fromEvent<KeyboardEvent>(this.doc, 'keydown').pipe(
      filter((e) => e.key === 'Escape'),
    );

    interface PointerStart {
      readonly event: PointerEvent;
      readonly fromIndex: number;
    }

    down$
      .pipe(
        filter(() => !this.disabled()),
        filter(() => this.activeDrag() === null),
        filter((e) => e.button === 0),
        map((event): PointerStart | null => {
          const target = event.target as Element | null;
          // Escape hatch: interactive children of the item (close
          // buttons, menu triggers, inline edit fields) keep their own
          // click semantics even when the whole row is drag-enabled.
          const ignore = this.ignoreSelector();
          if (ignore && target?.closest(ignore)) {
            return null;
          }
          const handleEl = target?.closest(this.handleSelector()) ?? null;
          if (!handleEl) {
            return null;
          }
          const itemEl = target?.closest<HTMLElement>(this.itemSelector()) ?? null;
          if (!itemEl || !this.hostEl.contains(itemEl)) {
            return null;
          }
          const fromIndex = this.parseIndex(itemEl);
          if (fromIndex < 0) {
            return null;
          }
          return { event, fromIndex };
        }),
        filter((start): start is PointerStart => start !== null),
        switchMap(({ event, fromIndex }) => {
          event.preventDefault();
          try {
            this.hostEl.setPointerCapture?.(event.pointerId);
          } catch {
            /* jsdom / older browsers */
          }
          this.activeDrag.set({
            pointerId: event.pointerId,
            fromIndex,
            currentIndex: fromIndex,
          });
          this.dragStart.emit(fromIndex);

          return move$.pipe(
            filter((m) => m.pointerId === event.pointerId),
            tap((m) => {
              const overEl = this.doc.elementFromPoint?.(m.clientX, m.clientY);
              if (!overEl) {
                return;
              }
              const itemEl = overEl.closest<HTMLElement>(this.itemSelector());
              if (!itemEl || !this.hostEl.contains(itemEl)) {
                return;
              }
              const overIndex = this.parseIndex(itemEl);
              if (overIndex < 0) {
                return;
              }
              const active = this.activeDrag();
              if (active && overIndex !== active.currentIndex) {
                this.activeDrag.set({ ...active, currentIndex: overIndex });
              }
            }),
            takeUntil(
              merge(
                up$.pipe(
                  filter((u) => u.pointerId === event.pointerId),
                  map(() => 'commit' as const),
                ),
                cancel$.pipe(
                  filter((c) => c.pointerId === event.pointerId),
                  map(() => 'cancel' as const),
                ),
                escape$.pipe(map(() => 'cancel' as const)),
              ).pipe(
                tap((outcome) => {
                  try {
                    this.hostEl.releasePointerCapture?.(event.pointerId);
                  } catch {
                    /* capture may have auto-released */
                  }
                  const active = this.activeDrag();
                  this.activeDrag.set(null);
                  this.dragEnd.emit();
                  if (outcome === 'commit' && active) {
                    const { fromIndex: from, currentIndex: to } = active;
                    if (to !== from) {
                      this.emitMove(from, to);
                    }
                  }
                }),
              ),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private wireKeyboard(): void {
    fromEvent<KeyboardEvent>(this.hostEl, 'keydown')
      .pipe(
        filter(() => !this.disabled()),
        filter((e) => this.modifierMatches(e)),
        filter((e) => this.isReorderKey(e.key)),
        tap((e) => {
          const target = e.target as Element | null;
          const itemEl = target?.closest<HTMLElement>(this.itemSelector());
          if (!itemEl || !this.hostEl.contains(itemEl)) {
            return;
          }
          const fromIndex = this.parseIndex(itemEl);
          if (fromIndex < 0) {
            return;
          }
          const current = this.items()();
          const len = current.length;
          if (fromIndex >= len) {
            return;
          }
          let toIndex: number;
          switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
              toIndex = fromIndex - 1;
              break;
            case 'ArrowRight':
            case 'ArrowDown':
              toIndex = fromIndex + 1;
              break;
            case 'Home':
              toIndex = 0;
              break;
            case 'End':
              toIndex = len - 1;
              break;
            default:
              return;
          }
          if (toIndex < 0 || toIndex >= len || toIndex === fromIndex) {
            return;
          }
          e.preventDefault();
          this.emitMove(fromIndex, toIndex, current);
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private wireDevModeCheck(): void {
    if (!isDevMode()) {
      return;
    }
    afterNextRender(() => {
      const items = this.hostEl.querySelectorAll(this.itemSelector());
      if (items.length === 0) {
        // Not an error — an empty strip is a legitimate idle state.
        // Only warn when the consumer probably forgot to wire the attr.
        return;
      }
      let misconfigured = 0;
      items.forEach((el: Element) => {
        const idx = (el as HTMLElement).dataset['reorderIndex'];
        if (idx == null || !Number.isFinite(Number(idx))) {
          misconfigured += 1;
        }
      });
      if (misconfigured > 0) {
        console.warn(
          `[CngxReorder] ${misconfigured} element(s) match itemSelector ` +
            `"${this.itemSelector()}" but carry no numeric data-reorder-index. ` +
            'Pointer / keyboard moves targeting them will be ignored.',
        );
      }
    });
  }

  private parseIndex(el: HTMLElement): number {
    const raw = el.dataset['reorderIndex'];
    if (raw == null) {
      return -1;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0) {
      return -1;
    }
    return n;
  }

  private modifierMatches(event: KeyboardEvent): boolean {
    switch (this.keyboardModifier()) {
      case 'ctrl':
        return event.ctrlKey;
      case 'alt':
        return event.altKey;
      case 'meta':
        return event.metaKey;
    }
  }

  private isReorderKey(key: string): boolean {
    return (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'Home' ||
      key === 'End'
    );
  }

  private emitMove(from: number, to: number, source?: readonly T[]): void {
    const current = source ?? this.items()();
    if (from < 0 || from >= current.length) {
      return;
    }
    const clampedTo = Math.min(Math.max(to, 0), current.length - 1);
    if (clampedTo === from) {
      return;
    }
    const next = this.moveItem(current, from, clampedTo);
    this.reordered.emit({ fromIndex: from, toIndex: clampedTo, next });
  }

  private moveItem(arr: readonly T[], from: number, to: number): readonly T[] {
    const copy = arr.slice();
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }
}
