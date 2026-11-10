import { DestroyRef, Directive, inject } from '@angular/core';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import { connectRecyclerToActiveDescendant } from '@cngx/common/data';

import { CNGX_SELECT_PANEL_HOST } from '../panel-host';

/**
 * Owns the auto recycler's lifetime from the panel template. `cngx-select-panel`
 * mounts it once a flat list has reached the threshold, so a smaller list carries
 * no recycler, no scroll bridge and none of their effects or listeners.
 *
 * The slot write happens in the constructor, ahead of the row loop of the same
 * render pass, so the loop reads the window instead of the full list.
 *
 * @internal
 */
@Directive({
  selector: '[cngxSelectAutoRecycler]',
  standalone: true,
})
export class CngxSelectAutoRecycler {
  constructor() {
    const host = inject(CNGX_SELECT_PANEL_HOST);
    const handle = host.autoRecycler;
    if (!handle) {
      return;
    }
    const recycler = handle.create();
    handle.slot.register(recycler);
    connectRecyclerToActiveDescendant(recycler, inject(CngxActiveDescendant));
    inject(DestroyRef).onDestroy(() => handle.slot.unregister(recycler));
  }
}
