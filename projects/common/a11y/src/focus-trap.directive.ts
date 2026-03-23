import { type FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { computed, DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';

/**
 * Traps keyboard focus within the host element using the CDK `FocusTrap`.
 *
 * When enabled, Tab and Shift+Tab cycle only within the host element's
 * focusable children. When `autoFocus` is `true` (default), focus moves to
 * the first tabbable element automatically on activation.
 *
 * Wraps CDK's `FocusTrapFactory` with a declarative, Signal-driven API.
 * The CDK's imperative `create()` / `destroy()` / `enabled` setter lifecycle
 * is handled internally via `effect()` and `DestroyRef`.
 *
 * @usageNotes
 *
 * ### Modal dialog
 * ```html
 * <div cngxFocusTrap [enabled]="isOpen()" [autoFocus]="true"
 *      tabindex="-1" role="dialog" aria-modal="true"
 *      (keydown.escape)="isOpen.set(false)">
 *   <input placeholder="First input" />
 *   <button (click)="isOpen.set(false)">Close</button>
 * </div>
 * ```
 *
 * ### Drawer / sidebar
 * ```html
 * <nav cngxFocusTrap [enabled]="drawerOpen()" tabindex="-1">
 *   <a href="/home">Home</a>
 *   <a href="/settings">Settings</a>
 * </nav>
 * ```
 */
@Directive({
  selector: '[cngxFocusTrap]',
  exportAs: 'cngxFocusTrap',
  standalone: true,
})
export class CngxFocusTrap {
  /** Whether the focus trap is active. When `false`, Tab navigates normally. */
  readonly enabled = input<boolean>(false);
  /** Whether to auto-focus the first tabbable element when the trap activates. */
  readonly autoFocus = input<boolean>(true);

  /** Computed signal reflecting the current trap state. */
  readonly isActive = computed(() => this.enabled());

  private readonly _trap: FocusTrap;

  constructor() {
    const el = inject(ElementRef<HTMLElement>);
    this._trap = inject(FocusTrapFactory).create(el.nativeElement as HTMLElement);

    effect(() => {
      const enabled = this.enabled();
      this._trap.enabled = enabled;
      if (enabled && this.autoFocus()) {
        void this._trap.focusFirstTabbableElementWhenReady();
      }
    });

    inject(DestroyRef).onDestroy(() => this._trap.destroy());
  }

  /** Programmatically focus the first tabbable element within the trap. */
  focusFirst(): void {
    void this._trap.focusFirstTabbableElementWhenReady();
  }

  /** Programmatically focus the last tabbable element within the trap. */
  focusLast(): void {
    void this._trap.focusLastTabbableElementWhenReady();
  }
}
