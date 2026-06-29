import type { InputConfigFeature } from './input-config';

/**
 * Options for {@link withCurrency}.
 *
 * @category forms/input
 */
export interface CurrencyOptions {
  /** ISO 4217 currency code, e.g. `'USD'`, `'CHF'`, `'JPY'`. */
  readonly code: string;
  /**
   * Locale override for currency formatting. Falls back to the numeric locale
   * (`withNumericDefaults`) and then `LOCALE_ID`.
   */
  readonly locale?: string;
}

/**
 * Configures `CngxNumericInput` to format its value with a currency's grouping
 * and standard fraction digits (USD -> 2, JPY -> 0) - the currency **code**
 * drives the number; the symbol is never baked into the editable value. Render
 * the symbol with a `CngxPrefix` / `CngxSuffix` affix instead, so a screen
 * reader hears the field label rather than "dollar sign" and the editable text
 * stays a plain number (Pillar 3: configuration over a new organism).
 *
 * ```typescript
 * provideInputConfig(withCurrency({ code: 'CHF', locale: 'de-CH' }));
 * ```
 * ```html
 * <span class="row">
 *   <span cngxPrefix>CHF</span>
 *   <input cngxInput cngxNumericInput [field]="f.price" />
 * </span>
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withCurrency(options: CurrencyOptions): InputConfigFeature {
  return (config) => ({
    ...config,
    numericCurrency: options.code,
    ...(options.locale != null && { numericLocale: options.locale }),
  });
}
