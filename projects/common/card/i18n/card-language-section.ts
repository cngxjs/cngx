// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The card section of a {@link CngxLanguagePack}. Same keys as
 * {@link CngxCardI18n}: the phrases a selectable card announces.
 *
 * @category common/card/i18n
 * @since 0.1.0
 * @relatedTo CngxCard
 */
export interface CngxCardLanguageSection {
  /** Announced when a selectable card becomes selected. */
  readonly selected: string;
  /** Announced when a selectable card becomes deselected. */
  readonly deselected: string;
  /** Owns the live region while the card loads, pre-empting the selection phrase. */
  readonly loading: string;
}

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly card: CngxCardLanguageSection;
  }
}
