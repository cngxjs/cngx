// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The card section of a {@link CngxLanguagePack}. Same keys as
 * {@link CngxCardI18n}: the phrases a selectable card announces and the
 * order of a {@link CngxCardTimestamp} prefix and its date.
 *
 * @category common/card/i18n
 * @since 0.1.0
 * @relatedTo CngxCard, CngxCardTimestamp
 */
export interface CngxCardLanguageSection {
  /** Announced when a selectable card becomes selected. */
  readonly selected: string;
  /** Announced when a selectable card becomes deselected. */
  readonly deselected: string;
  /** Owns the live region while the card loads, pre-empting the selection phrase. */
  readonly loading: string;
  /**
   * Places a timestamp's prefix and its date: `{prefix}` and `{date}`, in the
   * order the language reads them. Text around them renders as written, as a
   * piece of its own with the host's gap on both sides - use it for words,
   * not for punctuation that has to touch the prefix or the date. A plain
   * string only: the timestamp renders the placeholders as elements, so a
   * function value cannot place them.
   */
  readonly timestamp: string;
}

/**
 * The English card section: the single source of the card's English copy.
 * `CNGX_CARD_I18N` defaults to it, and the shipped English pack is built from it.
 *
 * @category common/card/i18n
 * @since 0.1.0
 * @relatedTo CNGX_CARD_I18N
 */
export const CNGX_CARD_LANGUAGE_EN: CngxCardLanguageSection = {
  selected: 'Selected',
  deselected: 'Deselected',
  loading: 'Loading',
  timestamp: '{prefix} {date}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly card: CngxCardLanguageSection;
  }
}
