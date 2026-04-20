import {
  InjectionToken,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';

/**
 * Minimal focus-tracking state shared by every select-family trigger.
 *
 * All four variants (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`,
 * `CngxTypeahead`) previously declared an identical three-field
 * boilerplate — a `focusedState` writable signal, its `asReadonly`
 * projection, plus `markFocused()` / `markBlurred()` setters — inside
 * each component body. The actual variant-specific reactions to focus
 * (openOn cascade for single/multi, clearOnBlur for typeahead, input
 * autofocus for combobox) stay INSIDE each variant's `handleFocus` /
 * `handleBlur`; this factory only owns the primitive state slot so
 * `focused` has the same contract across the family.
 *
 * @category interactive
 */
export interface CngxTriggerFocusState {
  /**
   * Public, readonly focus flag. Bound by the form-field presenter,
   * passed into `CngxSelectInputSlotContext`, and read by
   * `@if (focused())` branches in variant templates.
   */
  readonly focused: Signal<boolean>;
  /** Writable handle — only the owning component touches it. */
  readonly writable: WritableSignal<boolean>;
  /** Imperative: "the trigger element received focus". */
  markFocused(): void;
  /** Imperative: "the trigger element lost focus". */
  markBlurred(): void;
}

/**
 * Build the shared focus-state slot for a select-family trigger.
 *
 * **Why a factory even though LOC-savings are tiny.** The primary win
 * is architectural: `focused` is now documented as a family contract,
 * swappable via {@link CNGX_TRIGGER_FOCUS_FACTORY} (useful for a
 * controlled-from-outside focus mode, test doubles, or a future
 * `CngxSelectFamilyFocusTrap` that ships a cross-variant focus
 * manager). Per-component LOC delta is ~flat; the decoupling is real.
 *
 * **What stays in each variant.** Everything non-primitive:
 * `handleFocus` / `handleBlur` body extensions (openOn cascade,
 * clearOnBlur typeahead reset, input autofocus wiring, presenter's
 * `markAsTouched` forwarding). Those are genuinely variant-specific
 * and don't belong in a shared helper.
 *
 * @example
 * ```ts
 * // CngxSelect
 * private readonly focus = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
 * readonly focused = this.focus.focused;
 *
 * protected handleFocus(): void {
 *   this.focus.markFocused();
 *   if (this.config.openOn === 'focus' || this.config.openOn === 'click+focus') {
 *     this.open();
 *   }
 * }
 * protected handleBlur(): void {
 *   this.focus.markBlurred();
 *   this.presenter?.fieldState().markAsTouched();
 * }
 * ```
 *
 * @category interactive
 */
export function createTriggerFocusState(): CngxTriggerFocusState {
  const writable = signal<boolean>(false);
  return {
    focused: writable.asReadonly(),
    writable,
    markFocused: () => {
      writable.set(true);
    },
    markBlurred: () => {
      writable.set(false);
    },
  };
}

/**
 * Factory-signature matching {@link createTriggerFocusState} — used by
 * {@link CNGX_TRIGGER_FOCUS_FACTORY} for DI-swappable focus-state
 * implementations.
 *
 * @category interactive
 */
export type CngxTriggerFocusFactory = () => CngxTriggerFocusState;

/**
 * Override-capable factory for the select-family shared trigger-focus
 * slot. Defaults to {@link createTriggerFocusState}.
 *
 * Symmetrical to the other select-family factory tokens
 * (`CNGX_SELECTION_CONTROLLER_FACTORY`, `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`,
 * `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`, `CNGX_DISPLAY_BINDING_FACTORY`,
 * `CNGX_TEMPLATE_REGISTRY_FACTORY`, `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY`).
 *
 * @example Override with a controlled (external) focus input:
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_TRIGGER_FOCUS_FACTORY,
 *     useValue: () => {
 *       const externalFocus = inject(MY_EXTERNAL_FOCUS_STATE);
 *       const writable = signal(false);
 *       // Ignore mark* calls — read from external source instead.
 *       return {
 *         focused: externalFocus,
 *         writable,
 *         markFocused: () => {},
 *         markBlurred: () => {},
 *       };
 *     },
 *   },
 * ],
 * ```
 *
 * @category interactive
 */
export const CNGX_TRIGGER_FOCUS_FACTORY = new InjectionToken<CngxTriggerFocusFactory>(
  'CNGX_TRIGGER_FOCUS_FACTORY',
  { providedIn: 'root', factory: () => createTriggerFocusState },
);
