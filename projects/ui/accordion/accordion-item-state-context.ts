import type { AsyncStatus } from '@cngx/core/utils';

/**
 * Template context handed to the busy (`*cngxAccordionItemBusy`) and error
 * (`*cngxAccordionItemError`) slots so an override can read the item's live
 * state without re-injecting it - parity with
 * {@link CngxAccordionItemIconContext}.
 *
 * `$implicit` is the current {@link AsyncStatus} (`loading` / `refreshing` in
 * the busy slot, `error` in the error slot). `message` carries the resolved
 * error string in the error state and is empty in the busy state, so an error
 * override can render the announced text (and a retry) without re-deriving it.
 *
 * @category ui/accordion
 */
export interface CngxAccordionItemStateContext {
  readonly $implicit: AsyncStatus;
  readonly message: string;
}
