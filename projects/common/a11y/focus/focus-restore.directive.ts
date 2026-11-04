import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  Injector,
  input,
  type Signal,
  signal,
  untracked,
} from '@angular/core';
import { createTransitionTracker } from '@cngx/core/utils';

/**
 * CSS selector matching natively-focusable elements: links with an
 * `href`, the enabled form controls, and anything with an explicit
 * non-negative `tabindex`. Form controls carry `:not(:disabled)` because
 * a disabled control is not in the tab order - without it a descendant
 * probe would count a disabled button as focusable and a restore target
 * could land on an unfocusable element. Single source of truth for "is
 * this focusable" - the element-level {@link CngxFocusRestore} predicate
 * matches against it, and descendant probes (e.g. "does this panel
 * contain a focusable child?") query against it. Keeping one selector
 * stops the two uses from drifting apart.
 *
 * @since 0.1.0
 */
export const CNGX_FOCUSABLE_SELECTOR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * @internal Lets a directive that composes `CngxFocusRestore` as a host
 * directive drive its capture / restore edges from its own state instead of
 * `[cngxFocusRestoreWhile]`. Provided by the composer on the same element
 * (`useExisting`); the restore directive resolves it lazily with
 * `self: true`, because the composer constructs after its host directives.
 */
export interface CngxFocusRestoreDriver {
  /** Whether the surface is engaged; wins over `[cngxFocusRestoreWhile]`. */
  readonly focusRestoreActive: Signal<boolean>;
}

/** @internal See {@link CngxFocusRestoreDriver}. */
export const CNGX_FOCUS_RESTORE_DRIVER = new InjectionToken<CngxFocusRestoreDriver>(
  'CngxFocusRestoreDriver',
);

/**
 * Stores the previously focused element and restores focus on destroy, or on
 * the falling edge of `[cngxFocusRestoreWhile]` for a surface that stays in
 * the DOM while closed.
 *
 * Prevents focus from falling to `<body>` when dynamic content is removed
 * (dialogs closing, panels collapsing, tabs switching). The directive captures
 * `document.activeElement` at initialization time and restores it when the
 * host element is destroyed.
 *
 * Fallback chain: stored element → provided fallback → nearest focusable ancestor.
 * When none resolves, focus is left where the browser put it - `<body>` is
 * deliberately never a restore target.
 *
 * ### Panel that restores focus on close
 * ```html
 * @if (panelOpen()) {
 *   <div cngxFocusRestore>
 *     Panel content…
 *     <button (click)="panelOpen.set(false)">Close</button>
 *   </div>
 * }
 * ```
 *
 * ### Persistent surface (drawer, sidebar overlay)
 * ```html
 * <aside cngxFocusRestore [cngxFocusRestoreWhile]="open()">…</aside>
 * ```
 * `true` captures the focused element, `false` restores it when focus is
 * still inside the host or has dropped to `<body>`. Focus the user moved
 * elsewhere in the meantime stays where it is.
 *
 * ### With explicit fallback
 * ```html
 * <div cngxFocusRestore [focusRestoreFallback]="fallbackBtn">
 *   Dynamic content…
 * </div>
 * <button #fallbackBtn>Fallback target</button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/focus/focus-restore.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAutofocus, CngxFocusTrap, CngxFocusVisible
 * <example-url>/#/common/a11y/focus-restore/inline-details</example-url>
 * <example-url>/#/common/a11y/focus-restore/panel-with-automatic-restore</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxFocusRestore]',
  exportAs: 'cngxFocusRestore',
  standalone: true,
})
export class CngxFocusRestore {
  /** Whether to restore focus when the host element is destroyed. */
  readonly restoreOnDestroy = input<boolean>(true);
  /** Explicit fallback element if the stored element is no longer in the DOM. */
  readonly fallback = input<HTMLElement | null>(null);
  /**
   * Bind to the open state of a surface that stays in the DOM while closed.
   * The `false -> true` edge captures the focused element, the
   * `true -> false` edge restores it when focus is inside the host or on
   * `<body>`. While bound, destroying the host restores only when it is
   * engaged. Unbound (`undefined`), only destroy and the manual
   * `capture()` / `restore()` apply.
   */
  readonly whileActive = input<boolean | undefined>(undefined, {
    alias: 'cngxFocusRestoreWhile',
  });

  private readonly doc = inject(DOCUMENT);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly storedElement = signal<HTMLElement | null>(null);

  private resolvedDriver: CngxFocusRestoreDriver | null | undefined = undefined;
  private driver(): CngxFocusRestoreDriver | null {
    if (this.resolvedDriver === undefined) {
      this.resolvedDriver = this.injector.get(CNGX_FOCUS_RESTORE_DRIVER, null, { self: true });
    }
    return this.resolvedDriver;
  }

  private readonly engaged = computed(
    () => this.driver()?.focusRestoreActive() ?? this.whileActive() === true,
  );
  private readonly engagement = createTransitionTracker(() => this.engaged());

  constructor() {
    const activeEl = this.doc.activeElement;
    if (activeEl instanceof HTMLElement) {
      this.storedElement.set(activeEl);
    }

    effect(() => {
      const current = this.engagement.current();
      if (current === this.engagement.previous()) {
        return;
      }
      untracked(() => (current ? this.captureOutside() : this.restoreIfFocusInside()));
    });

    inject(DestroyRef).onDestroy(() => {
      if (!this.restoreOnDestroy()) {
        return;
      }
      // A closed edge-driven surface already restored (or never captured);
      // tearing it down must not pull focus from wherever the user is.
      if (this.edgeDriven() && !untracked(this.engaged)) {
        return;
      }

      const target = this.resolveTarget();
      if (target) {
        target.focus();
      }
    });
  }

  /** Manually store the current focus target for later restoration. */
  capture(): void {
    const activeEl = this.doc.activeElement;
    if (activeEl instanceof HTMLElement) {
      this.storedElement.set(activeEl);
    }
  }

  /** Manually restore focus to the stored element. */
  restore(): void {
    const target = this.resolveTarget();
    if (target) {
      target.focus();
    }
  }

  private edgeDriven(): boolean {
    return this.driver() !== null || untracked(this.whileActive) !== undefined;
  }

  // A composer's trap can move focus inside before this edge runs; the
  // element inside is never the one to return to.
  private captureOutside(): void {
    const activeEl = this.doc.activeElement;
    if (activeEl instanceof HTMLElement && !this.host().contains(activeEl)) {
      this.storedElement.set(activeEl);
    }
  }

  private restoreIfFocusInside(): void {
    const activeEl = this.doc.activeElement;
    const lost = !activeEl || activeEl === this.doc.body || this.host().contains(activeEl);
    if (lost) {
      this.restore();
    }
  }

  private host(): HTMLElement {
    return this.el.nativeElement as HTMLElement;
  }

  /**
   * Walks the fallback chain:
   * 1. Stored element (if still in DOM and not body/self)
   * 2. Explicit fallback input
   * 3. Nearest focusable ancestor
   */
  private resolveTarget(): HTMLElement | null {
    const stored = this.storedElement();
    // Skip body - it signals "nothing meaningful was focused", not a real restore target.
    if (
      stored &&
      stored !== this.doc.body &&
      this.doc.contains(stored) &&
      stored !== (this.el.nativeElement as HTMLElement)
    ) {
      return stored;
    }

    const fallback = this.fallback();
    if (fallback && this.doc.contains(fallback)) {
      return fallback;
    }

    return this.findFocusableAncestor();
  }

  /** Traverses up the DOM tree looking for the first natively focusable element. */
  private findFocusableAncestor(): HTMLElement | null {
    let current = (this.el.nativeElement as HTMLElement).parentElement;
    while (current) {
      if (this.isFocusable(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Checks if an element is natively focusable (tabindex, links, form
   * controls). Element-level predicate over the shared
   * {@link CNGX_FOCUSABLE_SELECTOR}, so it never drifts from the
   * descendant-query callers.
   */
  private isFocusable(el: HTMLElement): boolean {
    return el.matches(CNGX_FOCUSABLE_SELECTOR);
  }
}
