export {
  CngxPaginator,
  type CngxPaginatorSkin,
  type CngxPaginatorDensity,
} from './paginator.component';
export { CNGX_PAGINATOR_HOST, type CngxPaginatorHost } from './paginator-host.token';
export {
  CngxPaginatorFirst,
  CngxPaginatorPrev,
  CngxPaginatorNext,
  CngxPaginatorLast,
} from './segments/paginator-nav.component';
export { CngxPaginatorPages } from './segments/paginator-pages.component';
export {
  CNGX_PAGINATOR_CONFIG,
  CNGX_PAGINATOR_DEFAULTS,
  type CngxPaginatorConfig,
  type CngxPaginatorAriaLabels,
  type CngxPaginatorConfigFeature,
  provideCngxPaginatorConfig,
  withPaginatorAriaLabels,
  injectPaginatorConfig,
} from './paginator-config';
