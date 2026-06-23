import { InjectionToken } from '@angular/core';

import { pageWindow, type PageWindow } from './page-model';

/**
 * The page-window computation `cngx-pgn-pages` calls per recompute: given the
 * current 0-based page, the total page count, and the per-instance
 * `siblingCount` / `boundaryCount`, return the rendered {@link PageWindow}. An
 * override implements a different truncation algorithm while still honouring the
 * consumer's sibling / boundary intent.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/segments/paginator-page-window.token.ts
 * @since 0.1.0
 */
export type CngxPaginatorPageWindowFn = (
  current: number,
  total: number,
  siblingCount: number,
  boundaryCount: number,
) => PageWindow;

/** The shape an override must match to swap the page-window computation. */
export type CngxPaginatorPageWindowFactory = () => CngxPaginatorPageWindowFn;

/**
 * Default page-window factory. Resolves to the built-in {@link pageWindow} math
 * (one sibling each side, one pinned boundary at each end at the `1 / 1`
 * defaults). The segment builds its window via
 * `inject(CNGX_PAGINATOR_PAGE_WINDOW_FACTORY)()` rather than calling this
 * directly, mirroring {@link createPaginatorAnnouncer}.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/segments/paginator-page-window.token.ts
 * @since 0.1.0
 */
export const createPaginatorPageWindow: CngxPaginatorPageWindowFactory = () => pageWindow;

/**
 * Swap token for the page-row truncation algorithm. The default resolves to
 * {@link createPaginatorPageWindow}; override it to replace the whole windowing
 * computation enterprise-wide (via `providers`) or per-component (via
 * `viewProviders`) without forking the segment. Per-instance tweaks to the
 * sibling / boundary counts use the `[siblingCount]` / `[boundaryCount]` inputs
 * on `cngx-pgn-pages` instead. Mirrors {@link CNGX_PAGINATOR_ANNOUNCER_FACTORY}.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/segments/paginator-page-window.token.ts
 * @since 0.1.0
 */
export const CNGX_PAGINATOR_PAGE_WINDOW_FACTORY =
  new InjectionToken<CngxPaginatorPageWindowFactory>('CngxPaginatorPageWindowFactory', {
    providedIn: 'root',
    factory: () => createPaginatorPageWindow,
  });
