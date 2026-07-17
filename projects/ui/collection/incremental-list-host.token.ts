/**
 * The collection organism reuses the paginator's read-mostly host contract
 * verbatim. `CngxIncrementalList` hosts the same `CngxPaginate` brain and
 * provides `CNGX_PAGINATOR_HOST` via `useExisting`, so a projected trigger atom
 * (`cngx-pgn-load-more`, `cngx-pgn-infinite`) injects the identical token and
 * needs only `next()` / `isBusy()` / `isLast()` / `cumulativeRange()`.
 *
 * This alias gives `@cngx/ui/collection` consumers a local import surface
 * without redefining the contract: one token, one shape, no new trigger context
 * type. The re-exported symbol is the same `InjectionToken` instance, so a
 * trigger imported from either entry resolves to the same provider.
 *
 * @category ui/collection
 */
export { CNGX_PAGINATOR_HOST, type CngxPaginatorHost } from '@cngx/ui/paginator';
