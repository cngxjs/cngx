import { signal, type WritableSignal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import type { CngxFieldAccessor, CngxFieldRef } from '../models';

/**
 * A writable mock of `CngxFieldRef` for testing.
 * Every property is a `WritableSignal` so tests can mutate state directly.
 */
export interface MockFieldRef<T = unknown> extends CngxFieldRef<T> {
  readonly name: WritableSignal<string>;
  readonly value: WritableSignal<T>;
  readonly errors: WritableSignal<ValidationError.WithFieldTree[]>;
  readonly touched: WritableSignal<boolean>;
  readonly dirty: WritableSignal<boolean>;
  readonly invalid: WritableSignal<boolean>;
  readonly valid: WritableSignal<boolean>;
  readonly required: WritableSignal<boolean>;
  readonly disabled: WritableSignal<boolean>;
  readonly pending: WritableSignal<boolean>;
  readonly hidden: WritableSignal<boolean>;
  readonly readonly: WritableSignal<boolean>;
  readonly disabledReasons: WritableSignal<readonly { readonly message?: string }[]>;
  readonly minLength: WritableSignal<number | undefined>;
  readonly maxLength: WritableSignal<number | undefined>;
  readonly min: WritableSignal<number | undefined>;
  readonly max: WritableSignal<number | undefined>;
  readonly pattern: WritableSignal<readonly RegExp[]>;
  readonly errorSummary: WritableSignal<ValidationError.WithFieldTree[]>;
  readonly submitting: WritableSignal<boolean>;
}

/** Options for {@link createMockField}. */
export interface MockFieldOptions<T = unknown> {
  name?: string;
  value?: T;
  required?: boolean;
  disabled?: boolean;
  touched?: boolean;
  dirty?: boolean;
  invalid?: boolean;
  pending?: boolean;
  hidden?: boolean;
  readonly?: boolean;
  errors?: ValidationError.WithFieldTree[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

/**
 * Creates a mock `CngxFieldAccessor` that returns a fully writable `MockFieldRef`.
 * Tests can mutate any signal to simulate field state changes.
 *
 * @example
 * ```typescript
 * const { accessor, ref } = createMockField({ name: 'email', required: true });
 * // Pass `accessor` to [field] input
 * // Mutate ref.touched.set(true) to simulate interaction
 * ```
 *
 * @category testing
 */
export function createMockField<T = string>(
  opts: MockFieldOptions<T> = {},
): { accessor: CngxFieldAccessor<T>; ref: MockFieldRef<T> } {
  const ref: MockFieldRef<T> = {
    name: signal(opts.name ?? 'test'),
    value: signal((opts.value ?? '') as T),
    errors: signal(opts.errors ?? []),
    touched: signal(opts.touched ?? false),
    dirty: signal(opts.dirty ?? false),
    invalid: signal(opts.invalid ?? false),
    valid: signal(!(opts.invalid ?? false)),
    required: signal(opts.required ?? false),
    disabled: signal(opts.disabled ?? false),
    pending: signal(opts.pending ?? false),
    hidden: signal(opts.hidden ?? false),
    readonly: signal(opts.readonly ?? false),
    disabledReasons: signal([]),
    minLength: signal(opts.minLength),
    maxLength: signal(opts.maxLength),
    min: signal(opts.min),
    max: signal(opts.max),
    pattern: signal([]),
    errorSummary: signal(opts.errors ?? []),
    submitting: signal(false),
    markAsTouched: () => ref.touched.set(true),
    markAsDirty: () => ref.dirty.set(true),
    focusBoundControl: () => {
      /* noop mock */
    },
    reset: () => {
      ref.touched.set(false);
      ref.dirty.set(false);
    },
  };

  const accessor: CngxFieldAccessor<T> = () => ref as CngxFieldRef<T>;
  return { accessor, ref };
}

/**
 * Creates a mock `ValidationError.WithFieldTree` for testing.
 *
 * @category testing
 */
export function mockValidationError(
  kind: string,
  message?: string,
  extra?: Record<string, unknown>,
): ValidationError.WithFieldTree {
  return {
    kind,
    message,
    fieldTree: (() => ({})) as never,
    ...extra,
  } as ValidationError.WithFieldTree;
}
