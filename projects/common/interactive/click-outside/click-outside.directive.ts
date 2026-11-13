import { DOCUMENT } from '@angular/common';
import {
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
import { fromEvent, switchMap } from 'rxjs';

/**
 * @internal Lets a directive that composes `CngxClickOutside` as a host
 * directive drive it from its own state instead of `[enabled]`. Provided by
 * the composer on the same element (`useExisting`); the atom resolves it
 * lazily with `self: true`, because the composer constructs after its host
 * directives.
 */
export interface CngxClickOutsideDriver {
  /** Whether outside interactions emit; wins over `[enabled]`. */
  readonly clickOutsideEnabled: Signal<boolean>;
}

/** @internal See {@link CngxClickOutsideDriver}. */
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
  /** When `false` the directive is disabled and no events are emitted. */
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

  constructor() {
    toObservable(this.eventType)
      .pipe(
        switchMap((type) => fromEvent<PointerEvent | MouseEvent | TouchEvent>(this.doc, type)),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (this.isOutside(e.target)) {
          this.clickOutside.emit(e);
        }
      });
  }

  private isOutside(target: EventTarget | null): boolean {
    const enabled = this.driver()?.clickOutsideEnabled() ?? this.enabled();
    if (!enabled) {
      return false;
    }
    const host = this.el.nativeElement as HTMLElement;
    if (host.contains(target as Node)) {
      return false;
    }
    return !(host.id !== '' && controlledIdsOf(target).includes(host.id));
  }
}
