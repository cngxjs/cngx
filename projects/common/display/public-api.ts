/**
 * @module @cngx/common/display
 *
 * Display-only atoms: no behavior, no state beyond presentational flags.
 * Icons, avatars, badges, dividers — building blocks that render content
 * without reacting to user input. For interactive atoms (ripple, async-click,
 * nav badges) see `@cngx/common/interactive`.
 */
export { CngxIcon } from './src/icon/icon.component';
export { CngxDivider } from './src/divider/divider.directive';
export { CngxAvatar } from './src/avatar/avatar.component';
export {
  CngxBadge,
  type CngxBadgeColor,
  type CngxBadgePosition,
} from './src/badge/badge.directive';
export { CngxChip } from './src/chip/chip.component';
export { CngxCheckboxIndicator } from './src/checkbox-indicator/checkbox-indicator.component';
export { CngxRadioIndicator } from './src/radio-indicator/radio-indicator.component';
export {
  CngxTag,
  type CngxTagVariant,
  type CngxTagColor,
  type CngxTagSize,
} from './src/tag/tag.directive';
export { type CngxTagConfig } from './src/tag/config/tag.config';
export { CNGX_TAG_CONFIG } from './src/tag/config/tag.config.defaults';
export {
  provideTagConfig,
  provideTagConfigAt,
  type CngxTagConfigFeature,
} from './src/tag/config/provide-tag-config';
export { injectTagConfig } from './src/tag/config/inject-tag-config';
export {
  withTagDefaults,
  withTagGroupDefaults,
  withTagColors,
  withTagSlots,
} from './src/tag/config/features';
export { CngxTagLabel } from './src/tag/slots/tag-label.directive';
export { CngxTagPrefix } from './src/tag/slots/tag-prefix.directive';
export { CngxTagSuffix } from './src/tag/slots/tag-suffix.directive';
export {
  type CngxTagLabelContext,
  type CngxTagPrefixContext,
  type CngxTagSuffixContext,
} from './src/tag/slots/tag-slot.context';
export {
  CNGX_TAG_GROUP,
  type CngxTagGroupHost,
} from './src/tag-group/tag-group.token';
export {
  CngxTagGroup,
  type CngxTagGroupGap,
  type CngxTagGroupAlign,
} from './src/tag-group/tag-group.component';
export { CngxTagGroupHeader } from './src/tag-group/slots/tag-group-header.directive';
export { CngxTagGroupAccessory } from './src/tag-group/slots/tag-group-accessory.directive';
export {
  type CngxTagGroupHeaderContext,
  type CngxTagGroupAccessoryContext,
} from './src/tag-group/slots/tag-group-slot.context';
