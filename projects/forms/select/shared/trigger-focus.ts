import { InjectionToken, signal, type Signal, type WritableSignal } from '@angular/core';

/**
 * Focus-state slot shared by every select-family trigger. It tracks focus on
 * the trigger (or the combobox input) only and feeds the display binding and
 * the slot contexts' `focused`. The field-facing `focused` and `touched` come
 * from focus entering and leaving the whole host, the open panel included.
 * Variant-specific reactions (openOn cascade, clearOnBlur, autofocus) stay in
 * each variant's `handleFocus`/`handleBlur`.
 *
 * @category forms/select
 */
export interface CngxTriggerFocusState {
  /** Readonly focus flag. */
  readonly focused: Signal<boolean>;
  /** Writable handle - only the owner touches it. */
  readonly writable: WritableSignal<boolean>;
  markFocused(): void;
  markBlurred(): void;
}

/**
 * Builds the focus-state slot.
 *
 * ```ts
 * private readonly focus = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
 * readonly focused = this.focus.focused;
 *
 * protected handleFocus(): void {
 *   this.focus.markFocused();
 *   if (this.config.openOn === 'focus') this.open();
 * }
 * ```
 *
 * @category forms/select
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
 * Factory signature for {@link CNGX_TRIGGER_FOCUS_FACTORY}.
 *
 * @category forms/select
 */
export type CngxTriggerFocusFactory = () => CngxTriggerFocusState;

/**
 * Factory token. Default {@link createTriggerFocusState}. Override for
 * external-controlled focus mode or test doubles.
 *
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_TRIGGER_FOCUS_FACTORY,
 *     useValue: () => ({
 *       focused: inject(MY_EXTERNAL_FOCUS_STATE),
 *       writable: signal(false),
 *       markFocused: () => {},
 *       markBlurred: () => {},
 *     }),
 *   },
 * ],
 * ```
 *
 * @category forms/select
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/trigger-focus.ts
 * @since 0.1.0
 */
export const CNGX_TRIGGER_FOCUS_FACTORY = new InjectionToken<CngxTriggerFocusFactory>(
  'CngxTriggerFocusFactory',
  { providedIn: 'root', factory: () => createTriggerFocusState },
);
