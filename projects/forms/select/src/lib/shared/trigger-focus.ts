import {
  InjectionToken,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';

/**
 * Focus-state slot shared by every select-family trigger. Variant-
 * specific reactions (openOn cascade, clearOnBlur, autofocus,
 * `markAsTouched` forwarding) stay in each variant's
 * `handleFocus`/`handleBlur`.
 *
 * @category interactive
 */
export interface CngxTriggerFocusState {
  /** Readonly focus flag. */
  readonly focused: Signal<boolean>;
  /** Writable handle — only the owner touches it. */
  readonly writable: WritableSignal<boolean>;
  markFocused(): void;
  markBlurred(): void;
}

/**
 * Builds the focus-state slot.
 *
 * @example
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
 * Factory signature for {@link CNGX_TRIGGER_FOCUS_FACTORY}.
 *
 * @category interactive
 */
export type CngxTriggerFocusFactory = () => CngxTriggerFocusState;

/**
 * Factory token. Default {@link createTriggerFocusState}. Override for
 * external-controlled focus mode or test doubles.
 *
 * @example
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
 * @category interactive
 */
export const CNGX_TRIGGER_FOCUS_FACTORY = new InjectionToken<CngxTriggerFocusFactory>(
  'CNGX_TRIGGER_FOCUS_FACTORY',
  { providedIn: 'root', factory: () => createTriggerFocusState },
);
