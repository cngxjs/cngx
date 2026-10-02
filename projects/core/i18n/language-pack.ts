/**
 * The language pack of an app: one section per cngx area that ships copy.
 *
 * Empty here on purpose. Each lib entry adds its own section through module
 * augmentation, so a pack is typed by exactly the cngx entries a consumer
 * imports and core never imports a lib type:
 *
 * ```ts
 * declare module '@cngx/core/i18n' {
 *   interface CngxLanguagePack {
 *     readonly card: CngxCardLanguageSection;
 *   }
 * }
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- augmentation point, filled by each lib entry
export interface CngxLanguagePack {}

/**
 * Locale metadata every pack carries next to its sections.
 *
 * @category core/i18n
 * @since 0.1.0
 */
export interface CngxLanguagePackMeta {
  /** BCP 47 tag of the pack, e.g. `'de'` or `'de-CH'`. Drives number format and plural rules. */
  readonly locale: string;
  /** Writing direction. Omitted means derived from `locale`. */
  readonly dir?: 'ltr' | 'rtl';
}

/**
 * A message that varies by plural category. The category is picked with
 * `Intl.PluralRules` of the active locale; `other` is the fallback for every
 * category the message leaves out.
 *
 * ```json
 * { "one": "{count} error", "other": "{count} errors" }
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 */
export interface CngxPluralMessage {
  readonly zero?: string;
  readonly one?: string;
  readonly two?: string;
  readonly few?: string;
  readonly many?: string;
  readonly other: string;
}

/**
 * Makes every section and every key of a section optional while keeping a
 * present message whole: a plural object that is given still needs `other`.
 *
 * @category core/i18n
 * @since 0.1.0
 */
export type CngxPartialSections<T> = {
  readonly [S in keyof T]?: { readonly [K in keyof T[S]]?: T[S][K] };
};

/**
 * A pack that may leave sections or keys out; missing keys read English.
 *
 * @category core/i18n
 * @since 0.1.0
 */
export type CngxPartialLanguagePack = CngxPartialSections<CngxLanguagePack>;
