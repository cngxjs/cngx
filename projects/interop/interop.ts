/**
 * @cngx/interop
 *
 * Adapters that bridge external state engines onto the cngx async-state
 * protocol. Secondary entry points:
 *   @cngx/interop/query   - TanStack Query adapter (fromQuery)
 *   @cngx/interop/signals - NgRx SignalStore feature (withCngxAsyncState)
 */

import { makeVersion } from '@cngx/utils';

/** @internal - replaced at publish time, not part of consumer API. */
export const VERSION = makeVersion('0.0.0-PLACEHOLDER');
