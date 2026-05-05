/**
 * @module @cngx/common/tabs
 */
export {
  CngxTabGroupPresenter,
  type CngxTabsCommitAction,
} from './src/presenter.directive';
export {
  CNGX_TAB_GROUP_HOST,
  type CngxTabGroupHost,
  type CngxTabHandle,
} from './src/tab-group-host.token';
export {
  CNGX_TAB_PANEL_HOST,
  type CngxTabPanelHost,
} from './src/tab-panel-host.token';
export { CngxTab } from './src/tab.directive';
export { CngxTabLabel } from './src/tab-label.directive';
export { CngxTabContent } from './src/tab-content.directive';
export { CngxTabsFragmentSync } from './src/router-sync.directive';
