import type { AsyncStatus } from '@cngx/core/utils';

/**
 * Template context handed to the busy (`*cngxDgaRowBusy`) and error
 * (`*cngxDgaRowError`) slots of a {@link CngxDataGridRow}, so an override can read
 * the row's live async state without re-injecting it.
 *
 * `$implicit` is the current {@link AsyncStatus} (`loading` / `refreshing` in the
 * busy slot, `error` in the error slot). `message` carries the resolved error
 * string in the error state and is empty in the busy state, so an error override
 * can render the announced text (and a retry) without re-deriving it.
 *
 * Re-declared locally as an identical shape to `CngxAccordionItemStateContext`
 * rather than imported from the accordion entry, so this entry pulls in nothing
 * from a sibling `@cngx/ui` entry (data-grid-accordion accepted-debt §1).
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export interface CngxDgaRowStateContext {
  readonly $implicit: AsyncStatus;
  readonly message: string;
}
