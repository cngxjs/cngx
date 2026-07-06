/**
 * @module @cngx/ui/breadcrumb
 */
export { CngxBreadcrumbBar } from './breadcrumb-bar.component';
export { CngxBreadcrumbOverflow } from './breadcrumb-overflow.component';
export { CngxBreadcrumbSiblings } from './breadcrumb-siblings.component';
export {
  CngxBreadcrumbOverflowItem,
  type CngxBreadcrumbOverflowItemContext,
} from './breadcrumb-overflow-item.directive';
export {
  CngxBreadcrumbSiblingItem,
  type CngxBreadcrumbSiblingItemContext,
} from './breadcrumb-sibling-item.directive';
export {
  CngxBreadcrumbItemAccessory,
  type CngxBreadcrumbItemAccessoryContext,
} from './breadcrumb-item-accessory.directive';
export type { CngxBreadcrumbCrumb, CngxBreadcrumbSibling } from './breadcrumb.types';
export {
  CNGX_BREADCRUMB_ITEMS_SOURCE,
  type CngxBreadcrumbItemsSource,
} from './breadcrumb-items-source.token';
export {
  CNGX_BREADCRUMB_SIBLINGS_SOURCE,
  type CngxBreadcrumbSiblingsSource,
} from './breadcrumb-siblings-source.token';
export { CngxBreadcrumbRouterSync } from './breadcrumb-router-sync.directive';
export { CngxBreadcrumbSiblingsRouterSync } from './breadcrumb-siblings-router-sync.directive';
export { type CngxBreadcrumbConfig } from './config/breadcrumb.config';
export { CNGX_BREADCRUMB_CONFIG } from './config/breadcrumb.config.defaults';
export { withBreadcrumbAriaLabels, withBreadcrumbDataKey } from './config/features';
export {
  provideBreadcrumbConfig,
  provideBreadcrumbConfigAt,
  type CngxBreadcrumbConfigFeature,
} from './config/provide-breadcrumb-config';
export { injectBreadcrumbConfig } from './config/inject-breadcrumb-config';
