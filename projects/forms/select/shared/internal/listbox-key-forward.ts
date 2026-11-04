import type { Signal } from '@angular/core';
import type { CngxListbox } from '@cngx/common/interactive';

/**
 * @internal
 *
 * Keydown handler for a text input that drives a listbox it does not own
 * focus of: ArrowUp/Down move the highlight, Enter activates the highlighted
 * option, Escape calls `escape`. A key that confirms an IME composition
 * (`isComposing`, or the legacy `keyCode === 229`) is left to the input, so a
 * composition-ending Enter never activates.
 *
 * `homeEnd` picks what Home / End do: `'caret'` (default) leaves them with the
 * input caret; `'listbox'` moves the highlight to the first / last option (the
 * documented contract of `<cngx-select-search>`). Shared by the declarative
 * `<cngx-select-search>` and the sheet header input.
 */
export function createListboxKeyForward(
  listboxRef: Signal<CngxListbox | undefined>,
  escape: () => void,
  options: { readonly homeEnd?: 'listbox' | 'caret' } = {},
): (event: KeyboardEvent) => void {
  const homeEnd = options.homeEnd ?? 'caret';
  return (event) => {
    if (event.isComposing || event.keyCode === 229) {
      return;
    }
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
        if (homeEnd === 'listbox') {
          event.preventDefault();
          ad.highlightFirst();
        }
        break;
      case 'End':
        if (homeEnd === 'listbox') {
          event.preventDefault();
          ad.highlightLast();
        }
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
