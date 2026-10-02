// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The layout section of a {@link CngxLanguagePack}: the copy of the
 * `@cngx/common/layout` atoms. It feeds `CNGX_LAYOUT_I18N`.
 *
 * @category common/layout/i18n
 * @since 0.1.0
 * @relatedTo CNGX_LAYOUT_I18N
 */
export interface CngxLayoutLanguageSection {
  /** Label of the `CngxExpandableText` expand control. */
  readonly expandableTextMore: string;
  /** Label of the `CngxExpandableText` collapse control. */
  readonly expandableTextLess: string;
}

/**
 * The English layout section: the single source of the layout atoms'
 * English copy. `CNGX_LAYOUT_I18N` defaults to it.
 *
 * @category common/layout/i18n
 * @since 0.1.0
 * @relatedTo CNGX_LAYOUT_I18N
 */
export const CNGX_LAYOUT_LANGUAGE_EN: CngxLayoutLanguageSection = {
  expandableTextMore: 'Show more',
  expandableTextLess: 'Show less',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly layout: CngxLayoutLanguageSection;
  }
}
