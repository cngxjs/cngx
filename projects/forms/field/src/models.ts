import type { Signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';

/**
 * Abstraction over Angular Signal Forms' `FieldState`.
 *
 * Consumers pass `Field<T>` (a callable that returns `FieldState<T>`) to `CngxFormField`.
 * This interface documents the subset of `FieldState` that the form field system actually reads,
 * providing a stable contract even as Signal Forms evolves.
 *
 * @category structure
 */
export interface CngxFieldRef<T = unknown> {
  readonly name: Signal<string>;
  readonly value: Signal<T>;
  readonly errors: Signal<ValidationError.WithFieldTree[]>;
  readonly touched: Signal<boolean>;
  readonly dirty: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly valid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly pending: Signal<boolean>;
  readonly hidden: Signal<boolean>;
  readonly readonly: Signal<boolean>;
  readonly disabledReasons: Signal<readonly { readonly message?: string }[]>;
  readonly minLength?: Signal<number | undefined>;
  readonly maxLength?: Signal<number | undefined>;
  readonly min?: Signal<number | undefined>;
  readonly max?: Signal<number | undefined>;
  readonly pattern: Signal<readonly RegExp[]>;
  readonly errorSummary: Signal<ValidationError.WithFieldTree[]>;
  readonly submitting: Signal<boolean>;

  markAsTouched(): void;
  markAsDirty(): void;
  focusBoundControl(options?: FocusOptions): void;
  reset(value?: T): void;
}

/**
 * A callable that returns a `CngxFieldRef` — matches the shape of Angular Signal Forms' `Field<T>`.
 *
 * ```ts
 * // Signal Forms field is already a callable:
 * const emailField: Field<string> = schema(...);
 * // Pass directly:
 * <cngx-form-field [field]="emailField">
 * ```
 *
 * @category structure
 */
export type CngxFieldAccessor<T = unknown> = () => CngxFieldRef<T>;

/**
 * Contract for controls that can participate in a `cngx-form-field`.
 *
 * `CngxInput` provides this natively. Third-party controls (including `matInput` via
 * `CngxMatInputBridge`) can adapt to this interface.
 *
 * @category structure
 */
export interface CngxFormFieldControl {
  /** Unique element ID for the control. */
  readonly id: Signal<string>;
  /** Whether the control currently has DOM focus. */
  readonly focused: Signal<boolean>;
  /** Whether the control's value is empty. */
  readonly empty: Signal<boolean>;
  /** Whether the control is disabled. */
  readonly disabled: Signal<boolean>;
  /** Whether the control is in an error state. */
  readonly errorState: Signal<boolean>;
  /** Programmatically focus the control. */
  focus?(options?: FocusOptions): void;
}

/**
 * A function that maps a validation error to a human-readable message string.
 *
 * @param error The validation error value (e.g. `{ kind: 'required' }` or `{ kind: 'minLength', minLength: 8 }`).
 * @returns A display-ready error message.
 *
 * @category errors
 */
export type ErrorMessageFn = (error: ValidationError.WithFieldTree) => string;

/**
 * A map of validation error `kind` strings to their message rendering functions.
 *
 * @example
 * ```ts
 * const messages: ErrorMessageMap = {
 *   required: () => 'This field is required.',
 *   minLength: (e) => `Minimum ${(e as unknown as { minLength: number }).minLength} characters.`,
 * };
 * ```
 *
 * @category errors
 */
export type ErrorMessageMap = Record<string, ErrorMessageFn>;
