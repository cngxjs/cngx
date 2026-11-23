import { DOCUMENT } from '@angular/common';
import {
  computed,
  Directive,
  ElementRef,
  inject,
  InjectionToken,
  Injector,
  input,
  output,
  type Signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, fromEvent, switchMap } from 'rxjs';

/**
 * Contract for a directive that composes `CngxClickOutside` as a host
 * directive and drives it from its own state instead of `[enabled]`.
 * `CngxDrawerSurface` implements it. Provided by the composer on the same
 * element (`useExisting`); the atom resolves it lazily with `self: true`,
 * because the composer constructs after its host directives.
 *
 * @relatedTo CngxClickOutside, CNGX_CLICK_OUTSIDE_DRIVER
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/click-outside/click-outside.directive.ts
 * @since 0.1.0
 */
export interface CngxClickOutsideDriver {
  /** Whether outside interactions emit; wins over `[enabled]`. */
  readonly clickOutsideEnabled: Signal<boolean>;
}

/**
 * Lets a composing directive (`CngxDrawerSurface`) decide whether
 * `CngxClickOutside` emits; when provided, it wins over `[enabled]`. Provide it
 * with `useExisting: <composer>` on the element that hosts the atom; see
 * {@link CngxClickOutsideDriver}.
 *
 * @relatedTo CngxClickOutside
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/click-outside/click-outside.directive.ts
 * @since 0.1.0
 */
export const CNGX_CLICK_OUTSIDE_DRIVER = new InjectionToken<CngxClickOutsideDriver>(
  'CngxClickOutsideDriver',
);

/** Ids listed in the `aria-controls` of the nearest controlling ancestor of `target`. */
function controlledIdsOf(target: EventTarget | null): readonly string[] {
  const element =
    target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  const controls = element?.closest('[aria-controls]')?.getAttribute('aria-controls');
  if (!controls) {
    return [];
  }
  return controls.split(/\s+/).filter(Boolean);
}

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
 * An interaction inside the element that controls the host is not outside:
 * when the nearest `[aria-controls]` ancestor of the event target lists the
 * host's `id`, nothing is emitted. The trigger of a panel toggles it itself,
 * so an outside dismissal on the same press would close and reopen it.
 * A host without an `id` has no controller and gets no exemption.
 *
 * Pointer-only: focus leaving the host by Tab emits nothing. Pair it with a
 * `(focusout)` check and an Escape binding so keyboard users can dismiss too.
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
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/click-outside/click-outside.directive.ts
 * @since 0.1.0
 * @relatedTo CngxKeyboardShortcut, CngxPopover
 * <example-url>/#/common/interactive/gestures/click-outside/dropdown</example-url>
 * <example-url>/#/common/interactive/gestures/click-outside/enabled-toggle</example-url>
 * <example-url>/#/common/interactive/gestures/click-outside/event-type</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxClickOutside]',
  exportAs: 'cngxClickOutside',
  standalone: true,
})
export class CngxClickOutside {
  /** The DOM event type to listen for. `'pointerdown'` covers both mouse and touch. */
  readonly eventType = input<'pointerdown' | 'click' | 'mousedown' | 'touchstart'>('pointerdown');
  /**
   * When `false` nothing is emitted and no document listener is attached.
   * A composing directive that provides `CNGX_CLICK_OUTSIDE_DRIVER` decides
   * instead; this input is then ignored.
   */
  readonly enabled = input<boolean>(true);
  /** Emitted when the user interacts outside the host element. */
  readonly clickOutside = output<PointerEvent | MouseEvent | TouchEvent>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  private resolvedDriver: CngxClickOutsideDriver | null | undefined = undefined;
  private driver(): CngxClickOutsideDriver | null {
    if (this.resolvedDriver === undefined) {
      this.resolvedDriver = this.injector.get(CNGX_CLICK_OUTSIDE_DRIVER, null, { self: true });
    }
    return this.resolvedDriver;
  }

  /** Whether outside interactions emit: the driver wins over `[enabled]`. */
  private readonly active = computed(() => this.driver()?.clickOutsideEnabled() ?? this.enabled());

  /** The event type to listen for, or `null` while inactive (no document listener). */
  private readonly listenType = computed(() => (this.active() ? this.eventType() : null));

  constructor() {
    toObservable(this.listenType)
      .pipe(
        switchMap((type) =>
          type ? fromEvent<PointerEvent | MouseEvent | TouchEvent>(this.doc, type) : EMPTY,
        ),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (this.isOutside(e)) {
          this.clickOutside.emit(e);
        }
      });
  }

  /**
   * Reads the event path instead of `host.contains(target)`: the path is fixed
   * at dispatch, so a target removed by an earlier listener of the same press
   * still counts as inside, and a press inside an open shadow root is not
   * mistaken for its retargeted shadow host.
   */
  private isOutside(event: Event): boolean {
    // Re-checked here: the listener detaches one effect flush after a disable.
    if (!this.active()) {
      return false;
    }
    const host = this.el.nativeElement as HTMLElement;
    const path = event.composedPath();
    if (path.includes(host)) {
      return false;
    }
    const origin = path[0] ?? event.target;
    return !(host.id !== '' && controlledIdsOf(origin).includes(host.id));
  }
}
