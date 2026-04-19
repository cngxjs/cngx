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
