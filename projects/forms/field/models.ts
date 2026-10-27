import type { Signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';

/**
 * Re-export - the canonical contract now lives at `@cngx/core/tokens` so
 * Level-2 atoms can implement and provide it without crossing the
 * Sheriff-enforced layer boundary. Public-API consumers keep their
 * existing `import { CngxFormFieldControl } from '@cngx/forms/field'`
 * path unchanged.
 */
export type { CngxFormFieldControl } from '@cngx/core/tokens';

/**
 * What the field of a validation error resolves to, as far as cngx reads it:
 * the focus hook and, from Signal Forms 21.1 on, the `[formField]` bindings.
 *
 * @since 0.1.0
 */
export interface CngxErrorFieldState {
  /** The `[formField]` controls bound to the field; empty for a group-level error. */
  readonly formFieldBindings?: Signal<readonly unknown[]>;
  /** Focuses the first bound control. Signal Forms 21.1 takes no options and ignores them. */
  focusBoundControl(options?: FocusOptions): void;
}

/**
 * A Signal Forms validation error bound to its field, as the form field
 * system reads it.
 *
 * Structural on purpose: Signal Forms names this type
 * `ValidationError.WithField` in 21.1 and `ValidationError.WithFieldTree`
 * from 21.2 on (with `WithField` left as a deprecated alias), and 22 makes the
 * field tree read-only. Every one of them is assignable to this shape, so the
 * `[field]` binding type-checks on every Angular version cngx supports without
 * naming a version-specific or deprecated type.
 *
 * @since 0.1.0
 */
export interface CngxFieldValidationError extends ValidationError {
  /** The field the error belongs to. */
  readonly fieldTree: () => CngxErrorFieldState;
}

/**
 * Abstraction over Angular Signal Forms' `FieldState`.
 *
 * Consumers pass `Field<T>` (a callable that returns `FieldState<T>`) to `CngxFormField`.
 * This interface documents the subset of `FieldState` that the form field system actually reads,
 * providing a stable contract even as Signal Forms evolves.
 */
export interface CngxFieldRef<T = unknown> {
  readonly name: Signal<string>;
  readonly value: Signal<T>;
  readonly errors: Signal<CngxFieldValidationError[]>;
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
  /**
   * Typed `unknown` on purpose: Signal Forms 21 reads `number | undefined`,
   * 22 reads the field's own value type (a string field yields a string).
   * Readers narrow to the numeric bound they understand.
   */
  readonly min?: Signal<unknown>;
  /** See {@link CngxFieldRef.min}. */
  readonly max?: Signal<unknown>;
  readonly pattern: Signal<readonly RegExp[]>;
  readonly errorSummary: Signal<CngxFieldValidationError[]>;
  readonly submitting: Signal<boolean>;

  markAsTouched(): void;
  markAsDirty(): void;
  focusBoundControl(options?: FocusOptions): void;
  reset(value?: T): void;
}

/**
 * A callable that returns a `CngxFieldRef` - matches the shape of Angular Signal Forms' `Field<T>`.
 *
 * ```ts
 * // Signal Forms field is already a callable:
 * const emailField: Field<string> = schema(...);
 * // Pass directly:
 * <cngx-form-field [field]="emailField">
 * ```
 */
export type CngxFieldAccessor<T = unknown> = () => CngxFieldRef<T>;

/**
 * A function that maps a validation error to a human-readable message string.
 *
 * @param error The validation error value (e.g. `{ kind: 'required' }` or `{ kind: 'minLength', minLength: 8 }`).
 * @returns A display-ready error message.
 */
export type ErrorMessageFn = (error: CngxFieldValidationError) => string;

/**
 * A map of validation error `kind` strings to their message rendering functions.
 *
 * ```ts
 * const messages: ErrorMessageMap = {
 *   required: () => 'This field is required.',
 *   minLength: (e) => `Minimum ${(e as unknown as { minLength: number }).minLength} characters.`,
 * };
 * ```
 */
export type ErrorMessageMap = Record<string, ErrorMessageFn>;
