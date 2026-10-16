import { inject } from '@angular/core';
import { CngxRuntimeError } from '@cngx/utils';

import { CngxPaginate } from './paginate.directive';

/**
 * Inject the surrounding {@link CngxPaginate} from a paginate add-on
 * directive. Throws a `CngxRuntimeError` with code `CNGX1063` when no
 * `[cngxPaginate]` is on the element or above it, in development and
 * production alike. `selector` names the add-on in the development message.
 *
 * @internal
 */
export function injectPaginate(selector: string): CngxPaginate {
  const paginate = inject(CngxPaginate, { optional: true });
  if (!paginate) {
    throw new CngxRuntimeError(
      'CNGX1063',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        `[${selector}] must be placed on or inside an element with [cngxPaginate], such as <cngx-paginator>.`,
    );
  }
  return paginate;
}
