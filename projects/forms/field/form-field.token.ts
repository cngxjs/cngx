import {
  type Provider,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Signal,
} from '@angular/core';
import type { ErrorMessageMap } from './models';

/**
 * Re-exports - control + host contracts live in `@cngx/core/tokens` so
 * Level-2 atoms in `@cngx/common/*` can provide them without violating
 * Sheriff (`lib:common` cannot import `lib:forms`). Public import path
 * `@cngx/forms/field` stays unchanged for consumers.
 */
export {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldControl,
  type CngxFormFieldHostContract,
} from '@cngx/core/tokens';

/**
 * Forms-side abstraction over "is the user-driven error reveal active?".
 * `CngxErrorScope` (via `CngxErrorScopeFieldBridge`) is the default producer;
 * router-driven, interceptor-driven, or test-harness triggers may provide
 * their own. Decouples the presenter from the scope contract.
 *
 * @category forms/field
 */
export interface CngxFormFieldRevealContract {
  /** Reactive flag - `true` when errors should be visible to the user. */
  readonly showErrors: Signal<boolean>;
}

/**
 * Resolves to the active error-reveal trigger for the surrounding
 * `CngxFormField` - the `showErrors` flag the presenter ORs into its error
 * gate, so a form can reveal every field's errors at once (typically on a
 * failed submit) rather than waiting for each to be touched.
 *
 * Producers:
 *
 * - `CngxErrorScopeFieldBridge` (default) - bridges the nearest `CngxErrorScope`.
 * - router-, interceptor-, or test-driven triggers - supply their own
 *   `CngxFormFieldRevealContract` instead.
 *
 * Optional. With no provider the presenter falls back to the
 * `touched OR strategy(...)` gate and the reveal channel is simply absent.
 *
 * @category forms/field
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/form-field.token.ts
 * @since 0.1.0
 * @relatedTo CngxErrorScopeFieldBridge, CngxFormFieldPresenter, CngxFormFieldRevealContract, CngxErrorScope
 */
export const CNGX_FORM_FIELD_REVEAL = new InjectionToken<CngxFormFieldRevealContract>(
  'CngxFormFieldReveal',
);

/**
 * Maps each validation error `kind` to the function that renders its message.
 * `CngxFieldErrors` and `CngxFormErrors` resolve their text against it.
 *
 * An unmapped `kind` falls back, in order:
 *
 * - the error's own `message`
 * - the raw `kind` string
 *
 * Populated by `withErrorMessages(...)` through `provideFormField`, or by the
 * `provideErrorMessages(...)` shortcut. The default factory returns an empty
 * map, so without a provider every error renders by its fallback string.
 *
 * ```ts
 * providers: [provideFormField(withErrorMessages({
 *   required: () => 'Required.',
 *   minLength: (e) => `Min ${(e as { minLength: number }).minLength} chars.`,
 * }))]
 * ```
 *
 * @category forms/field
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/form-field.token.ts
 * @since 0.1.0
 * @relatedTo withErrorMessages, provideErrorMessages, CngxFieldErrors, CngxFormErrors
 */
export const CNGX_ERROR_MESSAGES = new InjectionToken<ErrorMessageMap>('CngxErrorMessages', {
  factory: () => ({}),
});

/**
 * Application-wide configuration for cngx form fields.
 *
 * @category forms/field
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
   * Fully overrides the default error gate (`touched OR errorScope.showErrors`).
   * The presenter invokes this inside `untracked()` so strategy-internal
   * signal reads cannot widen `showError`'s dependency graph.
   */
  errorStrategy?: ErrorStrategyFn;
}

/**
 * Built-in error visibility strategies used by {@link withErrorStrategy}.
 *
 * @category forms/field
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
 * `submitted` reflects the ambient `CngxErrorScope.showErrors` state - `true`
 * after the scope has been revealed (typically on form submit).
 *
 * @category forms/field
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
 * @category forms/field
 */
export type ErrorStrategyFn = (context: ErrorStrategyContext) => boolean;

/** @internal */
const NAMED_ERROR_STRATEGIES: Readonly<Record<ErrorStrategyName, ErrorStrategyFn>> = {
  onTouched: (c) => c.touched,
  onDirty: (c) => c.dirty,
  onSubmit: (c) => c.submitted,
  onTouchedOrSubmit: (c) => c.touched || c.submitted,
  always: () => true,
};

/**
 * A feature configuration function returned by `withXxx()` helpers.
 *
 * @category forms/field
 */
export interface FormFieldFeature {
  /** @internal */
  readonly _apply: (config: FormFieldConfig) => FormFieldConfig;
}

/**
 * Holds the merged `FormFieldConfig` every `CngxFormField` in scope reads for
 * its defaults. Each slice comes from one `with*` feature:
 *
 * - error messages - `withErrorMessages`
 * - constraint-hint formatters - `withConstraintHints`
 * - required marker - `withRequiredMarker`
 * - autocomplete map - `withAutocompleteMappings`
 * - spellcheck-off set - `withNoSpellcheck`
 * - error-visibility strategy - `withErrorStrategy`
 *
 * Populated by `provideFormField(...)`. The default factory returns an empty
 * config, so without a provider every feature stays off and the presenter uses
 * its built-in behaviour (error gate `touched OR reveal`, no hints, no marker).
 *
 * Inject this only to read the resolved config - configure through
 * `provideFormField` and the `with*` features, never by providing the token
 * directly.
 *
 * @category forms/field
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/form-field.token.ts
 * @since 0.1.0
 * @relatedTo provideFormField, FormFieldConfig, CngxFormFieldPresenter
 */
export const CNGX_FORM_FIELD_CONFIG = new InjectionToken<FormFieldConfig>('CngxFormFieldConfig', {
  factory: () => ({}),
});

/**
 * Registers application-wide defaults for every `CngxFormField` in scope.
 * Each `with*` feature contributes one slice of `FormFieldConfig`; features
 * apply left to right, so a later feature overrides an earlier one on the
 * same key.
 *
 * Returns `EnvironmentProviders`, so it sits at an environment injector -
 * `bootstrapApplication`'s `providers`, or a lazy route's `providers`. It
 * cannot be placed on a component. Resolution is nearest-wins and replace,
 * not merge: a route-level `provideFormField` shadows the root one for that
 * subtree rather than deep-merging into it.
 *
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
 * @category forms/field
 * @relatedTo withErrorMessages, withErrorStrategy, withConstraintHints, withRequiredMarker, withAutocompleteMappings, withNoSpellcheck, provideErrorMessages, CNGX_FORM_FIELD_CONFIG
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
 * Binds only the validation message map, for apps that need no other form-field
 * config. Equivalent to `provideFormField(withErrorMessages(messages))`, but
 * provides `CNGX_ERROR_MESSAGES` directly without the config wrapper.
 *
 * Returns `EnvironmentProviders` - same placement as `provideFormField`: an
 * environment injector (app bootstrap or a route's `providers`), never a
 * component.
 *
 * ```ts
 * providers: [provideErrorMessages({ required: () => 'Required.' })]
 * ```
 *
 * @category forms/field
 * @relatedTo provideFormField, withErrorMessages, CNGX_ERROR_MESSAGES
 */
export function provideErrorMessages(messages: ErrorMessageMap): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: CNGX_ERROR_MESSAGES, useValue: messages }]);
}

/**
 * Register the application-wide validation error message map. Each entry maps an
 * error `kind` to a function that renders its display string; `CngxFieldErrors`
 * and `CngxFormErrors` resolve messages against it.
 *
 * Merges into any messages already on the config, so later features add to or
 * override earlier ones by `kind`.
 *
 * ```ts
 * provideFormField(withErrorMessages({
 *   required: () => 'Required.',
 *   minLength: (e) => `Min ${(e as { minLength: number }).minLength} chars.`,
 * }))
 * ```
 *
 * @category forms/field
 * @relatedTo provideFormField, provideErrorMessages, CNGX_ERROR_MESSAGES
 */
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
 * built-in
 * ```ts
 * provideFormField(withErrorStrategy('onSubmit'))
 * ```
 *
 * custom
 * ```ts
 * provideFormField(withErrorStrategy(
 *   (c) => c.invalid && (c.dirty || c.submitted),
 * ))
 * ```
 *
 * @category forms/field
 * @relatedTo provideFormField, CngxFormFieldPresenter
 */
export function withErrorStrategy(strategy: ErrorStrategyName | ErrorStrategyFn): FormFieldFeature {
  const fn: ErrorStrategyFn =
    typeof strategy === 'function' ? strategy : NAMED_ERROR_STRATEGIES[strategy];
  return { _apply: (c) => ({ ...c, errorStrategy: fn }) };
}

/**
 * Enable auto-generated constraint hints for all form fields.
 * Pass `true` for English defaults, or a `ConstraintHintFormatters` object for i18n.
 *
 * English defaults
 * ```ts
 * provideFormField(withConstraintHints())
 * ```
 *
 * German
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
 *
 * @category forms/field
 * @relatedTo provideFormField, CngxFormFieldPresenter
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
 *
 * @category forms/field
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
   * Pattern hint
   * ```ts
   * extra: (c) => c.patterns.length ? ['Must match the required format'] : []
   * ```
   *
   * Required hint
   * ```ts
   * extra: (c) => c.required ? ['This field is mandatory'] : []
   * ```
   */
  extra: (constraints: ConstraintMetadata) => string[];
}

/**
 * Constraint metadata passed to the `extra` hint formatter.
 *
 * @category forms/field
 */
export interface ConstraintMetadata {
  readonly minLength: number | undefined;
  readonly maxLength: number | undefined;
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly patterns: readonly RegExp[];
  readonly required: boolean;
}

/**
 * English default formatters for constraint hints.
 *
 * @category forms/field
 */
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
 * ```ts
 * provideFormField(withRequiredMarker())       // shows '*'
 * provideFormField(withRequiredMarker('(required)'))
 * ```
 *
 * @category forms/field
 * @relatedTo provideFormField, CngxLabel, CngxRequired
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
 * ```ts
 * provideFormField(withAutocompleteMappings({
 *   iban: 'cc-number',
 *   taxid: 'off',
 * }))
 * ```
 *
 * @category forms/field
 * @relatedTo provideFormField, withNoSpellcheck
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
 * ```ts
 * provideFormField(withNoSpellcheck(['iban', 'accountnumber', 'serialnumber']))
 * ```
 *
 * @category forms/field
 * @relatedTo provideFormField, withAutocompleteMappings
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
