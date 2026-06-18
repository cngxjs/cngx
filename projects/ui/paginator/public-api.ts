export {
  CngxPaginator,
  type CngxPaginatorSkin,
  type CngxPaginatorDensity,
} from './paginator.component';
export { CNGX_PAGINATOR_HOST, type CngxPaginatorHost } from './paginator-host.token';
export { CngxPaginatorLoading } from './paginator-loading.directive';
export {
  CngxPaginatorFirst,
  CngxPaginatorPrev,
  CngxPaginatorNext,
  CngxPaginatorLast,
} from './segments/paginator-nav.component';
export { CngxPaginatorPages } from './segments/paginator-pages.component';
export {
  CNGX_PAGINATOR_PAGE_WINDOW_FACTORY,
  createPaginatorPageWindow,
  type CngxPaginatorPageWindowFactory,
  type CngxPaginatorPageWindowFn,
} from './segments/paginator-page-window.token';
export { type PageWindow, type PageItem } from './segments/page-model';
export { CngxPaginatorRange } from './segments/paginator-range.component';
export { CngxPaginatorGoto } from './segments/paginator-goto.component';
export { CngxPaginatorPageSize } from './segments/paginator-page-size.component';
export { CngxPaginatorPageOfPages } from './segments/paginator-page-of-pages.component';
export { CngxPaginatorDots } from './segments/paginator-dots.component';
export { CngxPaginatorLoadMore } from './segments/paginator-load-more.component';
export {
  CNGX_PAGINATOR_CONFIG,
  CNGX_PAGINATOR_DEFAULTS,
  type CngxPaginatorConfig,
  type CngxPaginatorAriaLabels,
  type CngxPaginatorAnnouncements,
  type CngxPaginatorFormats,
  type CngxPaginatorTemplates,
  type CngxPaginatorConfigFeature,
  provideCngxPaginatorConfig,
  provideCngxPaginatorConfigAt,
  withPaginatorAriaLabels,
  withPaginatorAnnouncements,
  withPaginatorRangeFormat,
  withPaginatorTemplates,
  injectPaginatorConfig,
} from './paginator-config';
export {
  createPaginatorAnnouncer,
  CNGX_PAGINATOR_ANNOUNCER_FACTORY,
  type CngxPaginatorAnnouncer,
  type CngxPaginatorAnnouncerFactory,
} from './paginator-announcer';
