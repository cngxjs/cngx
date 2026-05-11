/**
 * @module @cngx/common/display
 *
 * Display-only atoms: no behavior, no state beyond presentational flags.
 * Icons, avatars, badges, dividers — building blocks that render content
 * without reacting to user input. For interactive atoms (ripple, async-click,
 * nav badges) see `@cngx/common/interactive`.
 */
export { CngxIcon } from './icon/icon.component';
export { CngxDivider } from './divider/divider.directive';
export { CngxAvatar } from './avatar/avatar.component';
export {
  CngxBadge,
  type CngxBadgeColor,
  type CngxBadgePosition,
} from './badge/badge.directive';
export { CngxChip } from './chip/chip.component';
export { CngxCheckboxIndicator } from './checkbox-indicator/checkbox-indicator.component';
export { CngxRadioIndicator } from './radio-indicator/radio-indicator.component';
export {
  CngxTag,
  type CngxTagVariant,
  type CngxTagColor,
  type CngxTagSize,
} from './tag/tag.directive';
export { type CngxTagConfig } from './tag/config/tag.config';
export { CNGX_TAG_CONFIG } from './tag/config/tag.config.defaults';
export {
  provideTagConfig,
  provideTagConfigAt,
  type CngxTagConfigFeature,
} from './tag/config/provide-tag-config';
export { injectTagConfig } from './tag/config/inject-tag-config';
export {
  withTagDefaults,
  withTagGroupDefaults,
  withTagColors,
  withTagSlots,
} from './tag/config/features';
export { CngxTagLabel } from './tag/slots/tag-label.directive';
export { CngxTagPrefix } from './tag/slots/tag-prefix.directive';
export { CngxTagSuffix } from './tag/slots/tag-suffix.directive';
export {
  type CngxTagLabelContext,
  type CngxTagPrefixContext,
  type CngxTagSuffixContext,
} from './tag/slots/tag-slot.context';
export {
  CNGX_TAG_GROUP,
  type CngxTagGroupHost,
} from './tag-group/tag-group.token';
export {
  CngxTagGroup,
  type CngxTagGroupGap,
  type CngxTagGroupAlign,
} from './tag-group/tag-group.component';
export { CngxTagGroupHeader } from './tag-group/slots/tag-group-header.directive';
export { CngxTagGroupAccessory } from './tag-group/slots/tag-group-accessory.directive';
export {
  type CngxTagGroupHeaderContext,
  type CngxTagGroupAccessoryContext,
} from './tag-group/slots/tag-group-slot.context';
