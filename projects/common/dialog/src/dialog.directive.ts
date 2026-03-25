import { DOCUMENT } from '@angular/common';
import {
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  Renderer2,
  signal,
} from '@angular/core';

import { DIALOG_REF, type DialogRef, type DialogState } from './dialog-ref';
import { CngxDialogStack } from './dialog-stack';
import { CngxDialogTitle } from './dialog-title.directive';
import { CngxDialogDescription } from './dialog-description.directive';

let nextUid = 0;

/** Shared ref-count for scroll lock on the same document. */
const lockCounts = new WeakMap<HTMLElement, number>();

function acquireScrollLock(html: HTMLElement): void {
  const count = lockCounts.get(html) ?? 0;
  if (count === 0) {
    html.dataset['cngxPrevOverflow'] = html.style.overflow;
    html.dataset['cngxPrevScrollbarGutter'] = html.style.scrollbarGutter;
    html.style.overflow = 'hidden';
    html.style.scrollbarGutter = 'stable';
  }
  lockCounts.set(html, count + 1);
}

function releaseScrollLock(html: HTMLElement): void {
  const count = lockCounts.get(html) ?? 0;
  if (count <= 1) {
    html.style.overflow = html.dataset['cngxPrevOverflow'] ?? '';
    html.style.scrollbarGutter = html.dataset['cngxPrevScrollbarGutter'] ?? '';
    delete html.dataset['cngxPrevOverflow'];
    delete html.dataset['cngxPrevScrollbarGutter'];
    lockCounts.set(html, 0);
  } else {
    lockCounts.set(html, count - 1);
  }
}

/**
 * Signal-driven state machine for native `<dialog>`.
 *
 * Wraps the browser's `<dialog>` element with reactive state, typed results,
 * deterministic focus management, and full ARIA communication. Supports both
 * modal and non-modal modes, CSS transition-aware open/close lifecycle, and
 * ref-counted scroll locking for stacked modals.
 *
 * The directive implements `DialogRef<T>` and provides itself via `DIALOG_REF`,
 * so child directives (`CngxDialogTitle`, `CngxDialogClose`, etc.) can inject
 * the reference without explicit wiring.
 *
 * State lifecycle: `closed` -> `opening` -> `open` -> `closing` -> `closed`.
 * CSS classes `cngx-dialog--opening`, `cngx-dialog--open`, and
 * `cngx-dialog--closing` are applied to the host for transition hooks.
 *
 * @usageNotes
 *
 * ### Declarative (template-driven)
 * ```html
 * <dialog cngxDialog #dlg="cngxDialog">
 *   <h2 cngxDialogTitle>Delete item?</h2>
 *   <p cngxDialogDescription>This cannot be undone.</p>
 *   <button [cngxDialogClose]="false">Cancel</button>
 *   <button [cngxDialogClose]="true">Delete</button>
 * </dialog>
 * <button (click)="dlg.open()">Delete</button>
 *
 * @if (dlg.state() === 'closed' && dlg.result() === true) {
 *   <p>Item deleted.</p>
 * }
 * ```
 *
 * ### Programmatic (via CngxDialogOpener)
 * ```typescript
 * const ref = this.dialogService.open<boolean>(ConfirmDialog, {
 *   data: { message: 'Delete item?' },
 * });
 *
 * ref.afterClosed().subscribe(result => {
 *   if (result === true) this.delete();
 * });
 * ```
 *
 * ### Non-modal dialog
 * ```html
 * <dialog cngxDialog [modal]="false" #tooltip="cngxDialog">
 *   <p>Inline tooltip content</p>
 * </dialog>
 * ```
 *
 * ### Custom focus target
 * ```html
 * <dialog cngxDialog [autoFocus]="'#name-input'">
 *   <input id="name-input" />
 * </dialog>
 * ```
 */
@Directive({
  selector: 'dialog[cngxDialog]',
  exportAs: 'cngxDialog',
  standalone: true,
  providers: [{ provide: DIALOG_REF, useExisting: CngxDialog }],
  host: {
    '[class.cngx-dialog--opening]': 'isOpening()',
    '[class.cngx-dialog--open]': 'isOpen()',
    '[class.cngx-dialog--closing]': 'isClosing()',
    '[class.cngx-dialog--modal]': 'modal()',
    '[attr.aria-modal]': 'ariaModal()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
    '[class.cngx-dialog--error]': 'error()',
    '[attr.aria-invalid]': 'error() || null',
    '[style.--cngx-dialog-backdrop-opacity]': 'backdropOpacity()',
    '(cancel)': 'handleCancel($event)',
    '(click)': 'handleClick($event)',
  },
})
export class CngxDialog<T = unknown> implements DialogRef<T> {
  private readonly elRef = inject<ElementRef<HTMLDialogElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogStack = inject(CngxDialogStack);

  // ── Content children ──────────────────────────────────────────────
  private readonly titleDirective = contentChild(CngxDialogTitle);
  private readonly descriptionDirective = contentChild(CngxDialogDescription);

  // ── Inputs ────────────────────────────────────────────────────────
  /**
   * Whether the dialog opens as modal (`showModal()`) or non-modal (`show()`).
   *
   * Modal dialogs block interaction with the rest of the page, acquire a
   * scroll lock, and participate in the `CngxDialogStack` for backdrop
   * management. Non-modal dialogs do not.
   *
   * @defaultValue `true`
   */
  readonly modal = input(true);

  /**
   * Whether clicking the backdrop dismisses the dialog.
   *
   * Only applies to modal dialogs. When `true`, a click on the
   * `::backdrop` pseudo-element calls `dismiss()`.
   *
   * @defaultValue `true`
   */
  readonly closeOnBackdropClick = input(true);

  /**
   * Whether pressing Escape dismisses the dialog.
   *
   * Only applies to modal dialogs. The native `cancel` event is always
   * prevented; this input controls whether `dismiss()` is called in response.
   *
   * @defaultValue `true`
   */
  readonly closeOnEscape = input(true);

  /**
   * Focus strategy applied after the dialog transitions to `'open'`.
   *
   * Only applies to modal dialogs.
   *
   * - `'first-focusable'` -- focus the first `[autofocus]` element, or the
   *   first focusable element in DOM order (default)
   * - `'none'` -- do not move focus
   * - Any CSS selector string -- focus the first element matching the selector
   *
   * @defaultValue `'first-focusable'`
   */
  readonly autoFocus = input<'first-focusable' | 'none' | (string & {})>('first-focusable');

  /**
   * Fallback element to focus when the original trigger element has been
   * removed from the DOM by the time the dialog closes.
   *
   * When not set and the trigger is gone, no focus return occurs.
   */
  readonly focusFallback = input<HTMLElement | undefined>(undefined);

  /**
   * Whether the dialog is in an error state.
   *
   * When `true`, applies the `cngx-dialog--error` CSS class on the host and
   * sets `aria-invalid="true"`. Use this to communicate form submission
   * failures or other error conditions to screen readers.
   *
   * Pair with `cngx-form-errors` (`role="alert"`) inside the dialog for
   * WCAG-compliant error announcements.
   *
   * @defaultValue `false`
   */
  readonly error = input(false);

  // ── State ─────────────────────────────────────────────────────────
  private readonly stateSignal = signal<DialogState>('closed');
  private readonly resultSignal = signal<T | 'dismissed' | undefined>(undefined);
  private readonly idSignal = signal(`cngx-dialog-${nextUid++}`);
  private readonly triggerElement = signal<HTMLElement | null>(null);

  /**
   * Current lifecycle state of the dialog.
   *
   * Possible values: `'closed'`, `'opening'`, `'open'`, `'closing'`.
   */
  readonly state = this.stateSignal.asReadonly();

  /**
   * The typed result of the dialog.
   *
   * - `undefined` before close (reset on each `open()` call)
   * - `'dismissed'` when dismissed via Escape or backdrop click
   * - `T` when closed with an explicit value via `close(value)`
   */
  readonly result = this.resultSignal.asReadonly();

  /** Unique auto-generated ID for this dialog instance. Used for ARIA and stack tracking. */
  readonly id = this.idSignal.asReadonly();

  // ── Computed host bindings (protected for Angular compiler) ───────
  protected readonly isOpening = computed(() => this.stateSignal() === 'opening');
  protected readonly isOpen = computed(() => this.stateSignal() === 'open');
  protected readonly isClosing = computed(() => this.stateSignal() === 'closing');

  protected readonly ariaModal = computed(() =>
    this.modal() && this.stateSignal() !== 'closed' ? 'true' : null,
  );

  protected readonly ariaLabelledBy = computed(() => this.titleDirective()?.id() ?? null);

  protected readonly ariaDescribedBy = computed(() => this.descriptionDirective()?.id() ?? null);

  protected readonly backdropOpacity = computed(() =>
    this.dialogStack.topmost() === this.idSignal() ? null : '0',
  );

  // ── SR live region ────────────────────────────────────────────────
  private liveRegion: HTMLSpanElement | null = null;

  constructor() {
    this.createLiveRegion();

    // Announce title when state transitions to 'open'
    effect(() => {
      if (this.stateSignal() === 'open') {
        const titleText = this.titleDirective()?.textContent() ?? '';
        if (titleText && this.liveRegion) {
          this.liveRegion.textContent = titleText;
          // Clear after one frame so subsequent opens re-announce
          requestAnimationFrame(() => {
            if (this.liveRegion) {
              this.liveRegion.textContent = '';
            }
          });
        }
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.stateSignal() !== 'closed') {
        this.finalize();
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────────

  /**
   * Open the dialog.
   *
   * Resets the result from any previous open/close cycle, stores the
   * currently focused element for focus return, and calls the native
   * `showModal()` or `show()` depending on the `modal` input.
   *
   * No-op if the dialog is already open or in a transition state.
   */
  open(): void {
    if (this.stateSignal() !== 'closed') {
      return;
    }

    const dialog = this.dialogElement;

    // Reset result from previous cycle
    this.resultSignal.set(undefined);

    // Store trigger element for focus return
    this.triggerElement.set(this.doc.activeElement as HTMLElement | null);

    // Transition to opening
    this.stateSignal.set('opening');

    // Open native dialog
    if (this.modal()) {
      dialog.showModal();
      this.acquireScrollLock();
      this.dialogStack.push(this.idSignal());
    } else {
      dialog.show();
      this.warnNonModalA11y();
    }

    // Transition to open after browser paints the opening class
    requestAnimationFrame(() => {
      if (this.stateSignal() !== 'opening') {
        return;
      }
      this.stateSignal.set('open');
      this.moveFocus();
    });
  }

  /**
   * Close the dialog with a typed result.
   *
   * Sets `result` to `value`, then initiates the closing transition.
   * No-op if the dialog is not in the `'open'` or `'opening'` state.
   *
   * @param value - The typed result to deliver to consumers.
   */
  close(value: T): void {
    if (this.stateSignal() !== 'open' && this.stateSignal() !== 'opening') {
      return;
    }
    this.resultSignal.set(value);
    this.startClosing();
  }

  /**
   * Dismiss the dialog without a typed result.
   *
   * Sets `result` to `'dismissed'`, then initiates the closing transition.
   * Typically triggered by Escape key or backdrop click, but can be called
   * directly. No-op if the dialog is not in the `'open'` or `'opening'` state.
   */
  dismiss(): void {
    if (this.stateSignal() !== 'open' && this.stateSignal() !== 'opening') {
      return;
    }
    this.resultSignal.set('dismissed');
    this.startClosing();
  }

  // ── Event handlers (protected for host bindings) ──────────────────

  protected handleCancel(event: Event): void {
    event.preventDefault();
    if (this.closeOnEscape() && this.modal()) {
      this.dismiss();
    }
  }

  protected handleClick(event: MouseEvent): void {
    if (!this.modal() || !this.closeOnBackdropClick()) {
      return;
    }
    if (this.stateSignal() !== 'open') {
      return;
    }

    // Detect backdrop click: click coordinates outside dialog content rect
    const rect = this.dialogElement.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      this.dismiss();
    }
  }

  // ── Private ───────────────────────────────────────────────────────

  private get dialogElement(): HTMLDialogElement {
    return this.elRef.nativeElement;
  }

  private startClosing(): void {
    if (this.hasTransition()) {
      this.stateSignal.set('closing');
      this.listenForTransitionEnd();
    } else {
      this.finalize();
    }
  }

  private finalize(): void {
    const dialog = this.dialogElement;

    if (dialog.open) {
      dialog.close();
    }

    if (this.modal()) {
      this.releaseScrollLock();
      this.dialogStack.pop(this.idSignal());
    }

    this.stateSignal.set('closed');
    this.returnFocus();
  }

  private hasTransition(): boolean {
    const duration = getComputedStyle(this.dialogElement).transitionDuration;
    return duration.split(',').some((d) => Number.parseFloat(d.trim()) > 0);
  }

  private listenForTransitionEnd(): void {
    const dialog = this.dialogElement;
    const style = getComputedStyle(dialog);
    const durations = style.transitionDuration.split(',');
    const properties = style.transitionProperty.split(',').map((p) => p.trim());
    const parsedDurations = durations.map((d) => Number.parseFloat(d.trim()) * 1000);
    const maxDuration = Math.max(...parsedDurations);

    // Identify the longest-running property to wait for
    const longestPropIndex = parsedDurations.indexOf(maxDuration);
    const longestProp = properties[longestPropIndex] ?? properties[0] ?? 'all';

    let done = false;
    const finishOnce = () => {
      if (done) {
        return;
      }
      done = true;
      dialog.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallbackTimer);
      this.finalize();
    };

    const onTransitionEnd = (e: TransitionEvent) => {
      // Only finalize after the longest-running property completes
      if (e.target !== dialog) {
        return;
      }
      if (longestProp !== 'all' && e.propertyName !== longestProp) {
        return;
      }
      finishOnce();
    };

    // Fallback timeout in case transitionend never fires
    const fallbackTimer = setTimeout(finishOnce, maxDuration + 50);
    dialog.addEventListener('transitionend', onTransitionEnd);
  }

  private moveFocus(): void {
    if (!this.modal()) {
      return;
    }

    const strategy = this.autoFocus();
    const dialog = this.dialogElement;

    if (strategy === 'none') {
      return;
    }

    if (strategy === 'first-focusable') {
      // Native dialog with autofocus attribute works; otherwise focus first focusable
      const autofocusEl = dialog.querySelector<HTMLElement>('[autofocus]');
      if (autofocusEl) {
        autofocusEl.focus();
        return;
      }

      const focusable = dialog.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    } else {
      // CSS selector
      const target = dialog.querySelector<HTMLElement>(strategy);
      target?.focus();
    }
  }

  private returnFocus(): void {
    const trigger = this.triggerElement();

    if (trigger?.isConnected) {
      trigger.focus();
    } else {
      const fallback = this.focusFallback();
      fallback?.focus();
    }

    this.triggerElement.set(null);
  }

  private createLiveRegion(): void {
    const span = this.renderer.createElement('span') as HTMLSpanElement;
    span.setAttribute('aria-live', 'polite');
    span.setAttribute('aria-atomic', 'true');
    span.className = 'cngx-sr-only';
    span.style.position = 'absolute';
    span.style.width = '1px';
    span.style.height = '1px';
    span.style.padding = '0';
    span.style.margin = '-1px';
    span.style.overflow = 'hidden';
    span.style.clip = 'rect(0, 0, 0, 0)';
    span.style.whiteSpace = 'nowrap';
    span.style.border = '0';
    this.renderer.appendChild(this.dialogElement, span);
    this.liveRegion = span;
  }

  private acquireScrollLock(): void {
    acquireScrollLock(this.doc.documentElement);
  }

  private releaseScrollLock(): void {
    releaseScrollLock(this.doc.documentElement);
  }

  private warnNonModalA11y(): void {
    if (!isDevMode()) {
      return;
    }

    // Non-modal dialogs are silent to SR. Warn if no aria-live sibling found.
    const trigger = this.triggerElement();
    if (trigger) {
      const parent = trigger.parentElement;
      if (parent && !parent.querySelector('[aria-live]')) {
        console.warn(
          `CngxDialog [${this.idSignal()}]: Non-modal dialog opened without an ` +
            '`aria-live` region near the trigger. Screen reader users will not ' +
            'be notified that the dialog appeared. Add `aria-live="polite"` to a ' +
            'sibling element that announces the dialog presence.',
        );
      }
    }
  }
}
