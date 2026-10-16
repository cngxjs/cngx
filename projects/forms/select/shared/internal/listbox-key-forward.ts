import type { Signal } from '@angular/core';
import type { CngxListbox } from '@cngx/common/interactive';

/**
 * @internal
 *
 * Keydown handler for a text input that drives a listbox it does not own
 * focus of: ArrowUp/Down move the highlight, Home/End jump to the ends,
 * Enter activates the highlighted option, Escape calls `escape`. Shared by
 * the declarative `<cngx-select-search>` and the sheet header input.
 */
export function createListboxKeyForward(
  listboxRef: Signal<CngxListbox | undefined>,
  escape: () => void,
): (event: KeyboardEvent) => void {
  return (event) => {
    const lb = listboxRef();
    if (!lb) {
      return;
    }
    const ad = lb.ad;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        ad.highlightNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        ad.highlightPrev();
        break;
      case 'Home':
        event.preventDefault();
        ad.highlightFirst();
        break;
      case 'End':
        event.preventDefault();
        ad.highlightLast();
        break;
      case 'Enter':
        event.preventDefault();
        ad.activateCurrent();
        break;
      case 'Escape':
        event.preventDefault();
        escape();
        break;
    }
  };
}
