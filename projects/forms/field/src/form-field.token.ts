import {
  type Provider,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Signal,
} from '@angular/core';
import type { CngxFormFieldControl, ErrorMessageMap } from './models';

/**
 * Contract every reveal-trigger source fulfils.
 *
 * The Forms-side abstraction over "is the user-driven error reveal active
 * right now?". `CngxErrorScope` from `@cngx/common/interactive` is the
 * default producer (wired via `CngxErrorScopeFieldBridge`); custom
 * router-driven, interceptor-driven, or test-harness-driven triggers can
 * provide their own implementation without depending on `CngxErrorScope`.
 *
 * Decouples `CngxFormFieldPresenter` from the concrete scope contract —
 * the presenter only knows about this Forms-local interface.
 *
 * @category interfaces
 */
export interface CngxFormFieldRevealContract {
  /** Reactive flag — `true` when errors should be visible to the user. */
  readonly showErrors: Signal<boolean>;
}

/**
 * Injection token resolving to the active reveal trigger for the surrounding
 * `CngxFormField`. Optional — when no provider exists the presenter falls
 * back to the default `touched OR strategy(...)` gate without scope-driven
 * reveal semantics.
 *
 * @category tokens
 */
export const CNGX_FORM_FIELD_REVEAL = new InjectionToken<CngxFormFieldRevealContract>(
  'CngxFormFieldReveal',
);

/**
 * Injection token provided by controls (`CngxInput`, `CngxBindField`, `CngxListboxFieldBridge`) inside a `cngx-form-field`.
 * The presenter reads this to discover the active control.
 *
 * @category tokens
 */
export const CNGX_FORM_FIELD_CONTROL = new InjectionToken<CngxFormFieldControl>(
  'CngxFormFieldControl',
);

/**
 * Injection token for the application-wide error message map.
 * `CngxFieldErrors` uses this to auto-render validation messages.
 *
 * @example
 * ```ts
 * providers: [provideFormField(withErrorMessages({
 *   required: () => 'Required.',
 *   minLength: (e) => `Min ${(e as any).minLength} chars.`,
 * }))]
 * ```
 *
 * @category tokens
 */
export const CNGX_ERROR_MESSAGES = new InjectionToken<ErrorMessageMap>('CngxErrorMessages', {
  factory: () => ({}),
});

/**
 * Application-wide configuration for cngx form fields.
 *
 * @category configuration
 */
export interface FormFieldConfig {
  /** Error message map for auto-rendering. */
  errorMessages?: ErrorMessageMap;
  /**
   * When set, auto-generated constraint hints are shown (e.g. "8–64 characters").
   * Contains the resolved formatters (merged with English defaults by `withConstraintHints()`).
   * `undefined` means disabled.
   */
  constraintHints?: ConstraintHintFormatters;
  /**
   * Maps field names to `autocomplete` attribute values.
   * Merged with built-in defaults by `withAutocompleteMappings()`.
   */
  autocompleteMappings?: Record<string, string>;
  /**
   * Set of field names where `spellcheck` should be disabled.
   * Merged with built-in defaults by `withNoSpellcheck()`.
   */
  noSpellcheckFields?: ReadonlySet<string>;
  /**
   * When set, `CngxLabel` auto-renders a required marker for required fields.
   * The string value is the marker text (e.g. `'*'` or `'(required)'`).
   * Set to `false` or omit to disable. Individual labels can override via
   * `[showRequired]="false"`.
   */
  requiredMarker?: string | false;
  /**
   * When set, fully overrides the default error visibility gate
   * (`touched OR errorScope.showErrors`). The presenter calls the strategy
   * inside `untracked()` so strategy-internal signal reads do not widen
   * `showError`'s dependency graph.
   */
  errorStrategy?: ErrorStrategyFn;
}

/**
 * Built-in error visibility strategies used by {@link withErrorStrategy}.
 *
 * @category configuration
 */
export type ErrorStrategyName =
  | 'onTouched'
  | 'onDirty'
  | 'onSubmit'
  | 'onTouchedOrSubmit'
  | 'always';

/**
 * Snapshot passed to a custom {@link ErrorStrategyFn}.
 *
 * `submitted` reflects the ambient `CngxErrorScope.showErrors` state — `true`
 * after the scope has been revealed (typically on form submit).
 *
 * @category configuration
 */
export interface ErrorStrategyContext {
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly submitted: boolean;
  readonly invalid: boolean;
}

/**
 * Custom error visibility strategy. Returns `true` when errors should be
 * visible to the user.
 *
 * @category configuration
 */
export type ErrorStrategyFn = (context: ErrorStrategyContext) => boolean;

const NAMED_ERROR_STRATEGIES: Readonly<Record<ErrorStrategyName, ErrorStrategyFn>> = {
  onTouched: (c) => c.touched,
  onDirty: (c) => c.dirty,
  onSubmit: (c) => c.submitted,
  onTouchedOrSubmit: (c) => c.touched || c.submitted,
  always: () => true,
};

/** A feature configuration function returned by `withXxx()` helpers. */
export interface FormFieldFeature {
  /** @internal */
  readonly _apply: (config: FormFieldConfig) => FormFieldConfig;
}

/**
 * Injection token for the application-wide {@link FormFieldConfig}.
 *
 * @category tokens
 */
export const CNGX_FORM_FIELD_CONFIG = new InjectionToken<FormFieldConfig>('CngxFormFieldConfig', {
  factory: () => ({}),
});

/**
 * Registers application-wide defaults for all cngx form field instances.
 * Accepts `withXxx()` feature functions for composable configuration.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideFormField(
 *       withErrorMessages({ required: () => 'Required.' }),
 *       withConstraintHints(),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category configuration
 */
export function provideFormField(...features: FormFieldFeature[]): EnvironmentProviders {
  let config: FormFieldConfig = {};
  for (const f of features) {
    config = f._apply(config);
  }

  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: CNGX_FORM_FIELD_CONFIG, useValue: config },
  ];

  if (config.errorMessages) {
    providers.push({ provide: CNGX_ERROR_MESSAGES, useValue: config.errorMessages });
  }

  return makeEnvironmentProviders(providers);
}

/**
 * Convenience function to provide error messages without using `provideFormField`.
 *
 * @example
 * ```ts
 * providers: [provideErrorMessages({ required: () => 'Required.' })]
 * ```
 *
 * @category configuration
 */
export function provideErrorMessages(messages: ErrorMessageMap): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: CNGX_ERROR_MESSAGES, useValue: messages }]);
}

/** Enable auto-generated constraint hints (e.g. "8–64 characters") for all form fields. */
export function withErrorMessages(messages: ErrorMessageMap): FormFieldFeature {
  return { _apply: (c) => ({ ...c, errorMessages: { ...c.errorMessages, ...messages } }) };
}

/**
 * Configures the error visibility strategy used by `CngxFormFieldPresenter.showError`.
 *
 * Pass a built-in name (`'onTouched'`, `'onDirty'`, `'onSubmit'`,
 * `'onTouchedOrSubmit'`, `'always'`) or a custom {@link ErrorStrategyFn}.
 * The strategy fully overrides the default gate
 * (`touched OR errorScope.showErrors`).
 *
 * @example built-in
 * ```ts
 * provideFormField(withErrorStrategy('onSubmit'))
 * ```
 *
 * @example custom
 * ```ts
 * provideFormField(withErrorStrategy(
 *   (c) => c.invalid && (c.dirty || c.submitted),
 * ))
 * ```
 *
 * @category configuration
 */
export function withErrorStrategy(
  strategy: ErrorStrategyName | ErrorStrategyFn,
): FormFieldFeature {
  const fn: ErrorStrategyFn =
    typeof strategy === 'function' ? strategy : NAMED_ERROR_STRATEGIES[strategy];
  return { _apply: (c) => ({ ...c, errorStrategy: fn }) };
}

/**
 * Enable auto-generated constraint hints for all form fields.
 * Pass `true` for English defaults, or a `ConstraintHintFormatters` object for i18n.
 *
 * @example English defaults
 * ```ts
 * provideFormField(withConstraintHints())
 * ```
 *
 * @example German
 * ```ts
 * provideFormField(withConstraintHints({
 *   lengthRange: (min, max) => `${min}–${max} Zeichen`,
 *   minLength: (min) => `Mind. ${min} Zeichen`,
 *   maxLength: (max) => `Max. ${max} Zeichen`,
 *   valueRange: (min, max) => `${min}–${max}`,
 *   minValue: (min) => `Mind. ${min}`,
 *   maxValue: (max) => `Max. ${max}`,
 * }))
 * ```
 */
export function withConstraintHints(
  formatters?: Partial<ConstraintHintFormatters>,
): FormFieldFeature {
  const resolved: ConstraintHintFormatters = { ...DEFAULT_HINT_FORMATTERS, ...formatters };
  return { _apply: (c) => ({ ...c, constraintHints: resolved }) };
}

/**
 * Complete set of formatter functions for constraint hint text.
 * Stored in config after `withConstraintHints()` merges user overrides with defaults.
 */
export interface ConstraintHintFormatters {
  /** Format "8–64 characters". */
  lengthRange: (min: number, max: number) => string;
  /** Format "Min. 8 characters". */
  minLength: (min: number) => string;
  /** Format "Max. 64 characters". */
  maxLength: (max: number) => string;
  /** Format "0–100". */
  valueRange: (min: number, max: number) => string;
  /** Format "Min. 0". */
  minValue: (min: number) => string;
  /** Format "Max. 100". */
  maxValue: (max: number) => string;
  /**
   * Additional hints from custom constraints.
   * Receives constraint metadata and returns extra hint strings to append.
   *
   * @example Pattern hint
   * ```ts
   * extra: (c) => c.patterns.length ? ['Must match the required format'] : []
   * ```
   *
   * @example Required hint
   * ```ts
   * extra: (c) => c.required ? ['This field is mandatory'] : []
   * ```
   */
  extra: (constraints: ConstraintMetadata) => string[];
}

/** Constraint metadata passed to the `extra` hint formatter. */
export interface ConstraintMetadata {
  readonly minLength: number | undefined;
  readonly maxLength: number | undefined;
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly patterns: readonly RegExp[];
  readonly required: boolean;
}

/** English default formatters for constraint hints. */
export const DEFAULT_HINT_FORMATTERS: ConstraintHintFormatters = {
  lengthRange: (min, max) => `${min}–${max} characters`,
  minLength: (min) => `Min. ${min} characters`,
  maxLength: (max) => `Max. ${max} characters`,
  valueRange: (min, max) => `${min}–${max}`,
  minValue: (min) => `Min. ${min}`,
  maxValue: (max) => `Max. ${max}`,
  extra: () => [],
};

/**
 * Auto-render a required marker (e.g. `*`) inside every `CngxLabel` for required fields.
 * Individual labels can opt out via `[showRequired]="false"`.
 *
 * @param marker The marker text. Defaults to `'*'`.
 *
 * @example
 * ```ts
 * provideFormField(withRequiredMarker())       // shows '*'
 * provideFormField(withRequiredMarker('(required)'))
 * ```
 */
export function withRequiredMarker(marker = '*'): FormFieldFeature {
  return { _apply: (c) => ({ ...c, requiredMarker: marker }) };
}

/**
 * Built-in autocomplete mappings from normalized field names to HTML `autocomplete` values.
 * @internal Used by `CngxInput` and `withAutocompleteMappings()`.
 */
export const DEFAULT_AUTOCOMPLETE_MAPPINGS: Readonly<Record<string, string>> = {
  email: 'email',
  username: 'username',
  password: 'current-password',
  newpassword: 'new-password',
  confirmpassword: 'new-password',
  name: 'name',
  firstname: 'given-name',
  lastname: 'family-name',
  phone: 'tel',
  tel: 'tel',
  address: 'street-address',
  city: 'address-level2',
  zip: 'postal-code',
  postalcode: 'postal-code',
  country: 'country-name',
  organization: 'organization',
  url: 'url',
  website: 'url',
};

/**
 * @internal Used by `CngxInput` and `withNoSpellcheck()`.
 */
export const DEFAULT_NO_SPELLCHECK_FIELDS: ReadonlySet<string> = new Set([
  'email',
  'password',
  'newpassword',
  'confirmpassword',
  'username',
  'url',
  'website',
  'phone',
  'tel',
  'zip',
  'postalcode',
  'code',
]);

/**
 * Override or extend the autocomplete mappings for `CngxInput`.
 *
 * @param mappings Additional or replacement field-name-to-autocomplete entries.
 *   Merged with built-in defaults. Pass a key with value `''` to remove a mapping.
 *
 * @example
 * ```ts
 * provideFormField(withAutocompleteMappings({
 *   iban: 'cc-number',
 *   taxid: 'off',
 * }))
 * ```
 */
export function withAutocompleteMappings(mappings: Record<string, string>): FormFieldFeature {
  return {
    _apply: (c) => ({
      ...c,
      autocompleteMappings: {
        ...(c.autocompleteMappings ?? DEFAULT_AUTOCOMPLETE_MAPPINGS),
        ...mappings,
      },
    }),
  };
}

/**
 * Override or extend the set of field names where `spellcheck="false"` is auto-applied.
 *
 * @param fields Additional field names to disable spellcheck for.
 *
 * @example
 * ```ts
 * provideFormField(withNoSpellcheck(['iban', 'accountnumber', 'serialnumber']))
 * ```
 */
export function withNoSpellcheck(fields: string[]): FormFieldFeature {
  return {
    _apply: (c) => ({
      ...c,
      noSpellcheckFields: new Set([
        ...(c.noSpellcheckFields ?? DEFAULT_NO_SPELLCHECK_FIELDS),
        ...fields,
      ]),
    }),
  };
}
