import { type FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
} from '@angular/core';

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
 * **Nesting:** traps do not coordinate with each other. When traps nest
 * (dialog over drawer), enable only the innermost one and drive each
 * `enabled` from your layering state - two simultaneously enabled traps
 * fight over Tab. `CngxDialogStack` already does this for stacked dialogs.
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
 *
 * @category common/a11y
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/focus/focus-trap.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAutofocus, CngxFocusRestore, CngxDialog
 * <example-url>http://localhost:4200/#/common/a11y/focus-trap/modal-dialog</example-url>
 * <example-url>http://localhost:4200/#/common/a11y/focus-trap/slide-out-drawer</example-url>
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

  /**
   * Readable alias of `enabled` for `exportAs` consumers
   * (`trap.isActive()` reads better than re-binding the input).
   */
  readonly isActive = computed(() => this.enabled());

  private readonly trap: FocusTrap;

  constructor() {
    const el = inject(ElementRef<HTMLElement>);
    this.trap = inject(FocusTrapFactory).create(el.nativeElement as HTMLElement);

    // Track ONLY enabled: with autoFocus inside the tracked zone, flipping
    // [autoFocus] while the trap is active would re-run the effect and yank
    // focus back to the first tabbable element. The CDK calls are service
    // work, not dependencies.
    effect(() => {
      const enabled = this.enabled();
      untracked(() => {
        this.trap.enabled = enabled;
        if (enabled && this.autoFocus()) {
          void this.trap.focusFirstTabbableElementWhenReady();
        }
      });
    });

    inject(DestroyRef).onDestroy(() => this.trap.destroy());
  }

  /** Programmatically focus the first tabbable element within the trap. */
  focusFirst(): void {
    void this.trap.focusFirstTabbableElementWhenReady();
  }

  /** Programmatically focus the last tabbable element within the trap. */
  focusLast(): void {
    void this.trap.focusLastTabbableElementWhenReady();
  }
}
