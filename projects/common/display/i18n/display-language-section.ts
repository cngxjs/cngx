import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The display section of a {@link CngxLanguagePack}: the copy of the
 * `@cngx/common/display` atoms (avatar, avatar group, segmented progress,
 * chip, badge). It feeds `CNGX_DISPLAY_I18N`.
 *
 * @category common/display/i18n
 * @since 0.1.0
 * @relatedTo CNGX_DISPLAY_I18N
 */
export interface CngxDisplayLanguageSection {
  /** Accessible name of the avatar status dot, per status. */
  readonly avatarStatus: {
    readonly online: string;
    readonly offline: string;
    readonly busy: string;
    readonly away: string;
  };
  /** The entity noun of an avatar group summary. */
  readonly avatarGroupNoun: string;
  /** `{noun}`, plural on `{count}`: an avatar group summary with nothing collapsed. */
  readonly avatarGroupLabel: CngxMessage;
  /** `{noun}`, `{hidden}`, plural on `{count}`: an avatar group summary with collapsed avatars. */
  readonly avatarGroupLabelHidden: CngxMessage;
  /** `{count}`: the visible overflow pill of an avatar group. */
  readonly avatarGroupOverflow: CngxMessage;
  /** `{now}`, `{max}`: the value text of a segmented progress. */
  readonly segmentedProgressValueText: CngxMessage;
  /** Accessible name of a chip's remove button. */
  readonly chipRemove: string;
  /** `{max}`: a badge count above its maximum. */
  readonly badgeOverflow: CngxMessage;
}

/**
 * The English display section: the single source of the display atoms'
 * English copy. `CNGX_DISPLAY_I18N` defaults to it.
 *
 * @category common/display/i18n
 * @since 0.1.0
 * @relatedTo CNGX_DISPLAY_I18N
 */
export const CNGX_DISPLAY_LANGUAGE_EN: CngxDisplayLanguageSection = {
  avatarStatus: { online: 'online', offline: 'offline', busy: 'busy', away: 'away' },
  avatarGroupNoun: 'avatars',
  avatarGroupLabel: '{count} {noun}',
  avatarGroupLabelHidden: '{count} {noun}, {hidden} not shown',
  avatarGroupOverflow: '+{count}',
  segmentedProgressValueText: '{now} of {max}',
  chipRemove: 'Remove',
  badgeOverflow: '{max}+',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly display: CngxDisplayLanguageSection;
  }
}
