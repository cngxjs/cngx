/**
 * Public API Surface of @cngx/ui
 * @module @cngx/ui
 */

export * from './ui';
export { CngxSpeakButton } from './speak/speak-button';
export { CngxSidenavLayout } from './sidenav/sidenav-layout';
export { CngxSidenav, type SidenavPosition, type SidenavMode } from './sidenav/sidenav';
export { CngxSidenavContent } from './sidenav/sidenav-content';
export { CngxSidenavHeader } from './sidenav/sidenav-header';
export { CngxSidenavFooter } from './sidenav/sidenav-footer';
export { CngxSkeletonContainer } from './skeleton/skeleton-container';
export {
  CngxSkeletonPlaceholder,
  type CngxSkeletonPlaceholderContext,
} from './skeleton/skeleton-placeholder';
export * from '@cngx/ui/action-button';
// Re-export from @cngx/common/interactive for backwards compatibility
export { CngxPending, CngxSucceeded, CngxFailed } from '@cngx/common/interactive';
