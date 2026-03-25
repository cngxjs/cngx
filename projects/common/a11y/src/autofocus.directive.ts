import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  Injector,
} from '@angular/core';

/**
 * Reactive autofocus for dynamically inserted elements.
 *
 * The native `autofocus` HTML attribute only works on initial page load.
 * This directive handles dynamic content: dialogs, panels, stepper steps,
 * and any element that appears after the initial render.
 *
 * Focuses the host element after the next render frame using `afterNextRender`.
 * When `when` changes to `true`, focus is re-applied.
 *
 * @usageNotes
 *
 * ### Focus on insertion
 * ```html
 * @if (showSearch()) {
 *   <input cngxAutofocus placeholder="Search…" />
 * }
 * ```
 *
 * ### Conditional focus
 * ```html
 * <input [cngxAutofocus]="isActive()" />
 * ```
 *
 * ### With delay for transitions
 * ```html
 * <input cngxAutofocus [autofocusDelay]="200" />
 * ```
 *
 * @category a11y
 */
@Directive({
  selector: '[cngxAutofocus]',
  exportAs: 'cngxAutofocus',
  standalone: true,
})
export class CngxAutofocus {
  /** Whether to focus the element. Defaults to `true` (always focus on render). */
  readonly when = input<boolean>(true, { alias: 'cngxAutofocus' });
  /** Delay in ms before focusing — useful when the element appears during a transition. */
  readonly delay = input<number>(0, { alias: 'autofocusDelay' });
  /** `FocusOptions` passed to `element.focus()`. */
  readonly options = input<FocusOptions>({}, { alias: 'autofocusOptions' });

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  constructor() {
    // Clean up pending timers on destroy to avoid writing to detached elements.
    inject(DestroyRef).onDestroy(() => this.clearPending());

    // Initial focus after first render — this is the only path for initial focus.
    afterNextRender(() => {
      if (this.when()) {
        this.scheduleFocus();
      }
      this.initialized = true;
    });

    // Re-focus when `when` transitions from false to true (after init).
    // Skips the first run via the `initialized` guard to avoid double-focusing.
    let previousWhen = true; // matches default — no false→true on first run
    effect(() => {
      const current = this.when();
      if (this.initialized && current && !previousWhen) {
        this.scheduleFocus();
      }
      previousWhen = current;
    });
  }

  private scheduleFocus(): void {
    this.clearPending();
    const delayMs = this.delay();
    if (delayMs > 0) {
      this.pendingTimer = setTimeout(() => this.applyFocus(), delayMs);
    } else {
      afterNextRender(() => this.applyFocus(), { injector: this.injector });
    }
  }

  private applyFocus(): void {
    (this.el.nativeElement as HTMLElement).focus(this.options());
  }

  private clearPending(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }
}
