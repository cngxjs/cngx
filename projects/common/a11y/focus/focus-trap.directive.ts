import { type FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  type Signal,
  signal,
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

  private readonly enabledSource = signal<Signal<boolean> | null>(null);
  private readonly autoFocusOverride = signal<boolean | null>(null);

  /**
   * The enabled state the trap actually follows: a composer's source
   * (see {@link setEnabledSource}) wins over the `[enabled]` input.
   */
  private readonly effectiveEnabled = computed(() => this.enabledSource()?.() ?? this.enabled());

  /**
   * Readable alias of the effective enabled state for `exportAs` consumers
   * (`trap.isActive()` reads better than re-binding the input).
   */
  readonly isActive = computed(() => this.effectiveEnabled());

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly factory = inject(FocusTrapFactory);
  private trap: FocusTrap | null = null;

  constructor() {
    // Track ONLY the effective enabled state: with autoFocus inside the
    // tracked zone, flipping [autoFocus] while the trap is active would
    // re-run the effect and yank focus back to the first tabbable element.
    // The CDK calls are service work, not dependencies.
    effect(() => {
      const enabled = this.effectiveEnabled();
      untracked(() => {
        if (!enabled && !this.trap) {
          return;
        }
        const trap = this.ensureTrap();
        trap.enabled = enabled;
        if (enabled && !trap.hasAttached()) {
          trap.attachAnchors();
        }
        if (enabled && (this.autoFocusOverride() ?? this.autoFocus())) {
          void trap.focusFirstTabbableElementWhenReady();
        }
      });
    });

    inject(DestroyRef).onDestroy(() => this.trap?.destroy());
  }

  /**
   * @internal Drive the trap from a composer's signal instead of the
   * `[enabled]` input. `null` defers back to the input.
   */
  setEnabledSource(source: Signal<boolean> | null): void {
    this.enabledSource.set(source);
  }

  /**
   * @internal Install or clear the programmatic `autoFocus` override.
   * `null` defers back to the `[autoFocus]` input.
   */
  setAutoFocusOverride(value: boolean | null): void {
    this.autoFocusOverride.set(value);
  }

  /** Programmatically focus the first tabbable element within the trap. */
  focusFirst(): void {
    void this.ensureTrap().focusFirstTabbableElementWhenReady();
  }

  /** Programmatically focus the last tabbable element within the trap. */
  focusLast(): void {
    void this.ensureTrap().focusLastTabbableElementWhenReady();
  }

  /**
   * @internal Focus the first tabbable element right now, in the caller's
   * stack. `focusFirst()` waits for the next render, which is too late for a
   * composer that must move focus inside the user gesture that opened it.
   * Returns `false` when nothing inside is tabbable.
   */
  focusFirstNow(): boolean {
    return this.ensureTrap().focusFirstTabbableElement();
  }

  // Deferred anchors: the CDK sentinels are inserted on the first enable,
  // so a trap that is never enabled leaves the DOM untouched.
  private ensureTrap(): FocusTrap {
    this.trap ??= this.factory.create(this.host, true);
    return this.trap;
  }
}
