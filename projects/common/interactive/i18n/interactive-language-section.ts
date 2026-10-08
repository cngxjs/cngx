import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The interactive section of a {@link CngxLanguagePack}: the copy of the
 * `@cngx/common/interactive` atoms (async click, copy block, range slider,
 * breadcrumb, the unsaved-changes guard). It feeds `CNGX_INTERACTIVE_I18N`.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 * @relatedTo CNGX_INTERACTIVE_I18N
 */
export interface CngxInteractiveLanguageSection {
  /** Announced when an async click action resolves. */
  readonly asyncClickSucceeded: string;
  /** Announced when an async click action rejects. */
  readonly asyncClickFailed: string;
  /** Label of the copy-block button. */
  readonly copy: string;
  /** Label of the copy-block button after a copy. */
  readonly copied: string;
  /** Announced after a copy. */
  readonly copiedAnnouncement: string;
  /** Accessible name of the range slider's start thumb. */
  readonly rangeMinimum: string;
  /** Accessible name of the range slider's end thumb. */
  readonly rangeMaximum: string;
  /** Accessible name of the breadcrumb landmark. */
  readonly breadcrumb: string;
  /** Confirmation of `canDeactivateWhenClean` before leaving unsaved changes. */
  readonly unsavedChanges: string;
  /** `{start}`, `{end}`: the visible value of a range slider. */
  readonly rangeValue: CngxMessage;
}

/**
 * The English interactive section: the single source of the interactive
 * atoms' English copy. `CNGX_INTERACTIVE_I18N` defaults to it.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 * @relatedTo CNGX_INTERACTIVE_I18N
 */
export const CNGX_INTERACTIVE_LANGUAGE_EN: CngxInteractiveLanguageSection = {
  asyncClickSucceeded: 'Action succeeded',
  asyncClickFailed: 'Action failed',
  copy: 'Copy',
  copied: 'Copied!',
  copiedAnnouncement: 'Copied to clipboard',
  rangeMinimum: 'Minimum',
  rangeMaximum: 'Maximum',
  breadcrumb: 'Breadcrumb',
  unsavedChanges: 'You have unsaved changes. Leave anyway?',
  rangeValue: '{start}–{end}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly interactive: CngxInteractiveLanguageSection;
  }
}
