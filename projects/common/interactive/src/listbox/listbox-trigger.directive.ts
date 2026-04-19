import { computed, Directive, inject, input } from '@angular/core';

import type { CngxListbox } from './listbox.directive';
import { CngxListboxSearch } from './listbox-search.directive';

/**
 * Minimum popover contract this trigger expects. Matches `CngxPopover` from
 * `@cngx/common/popover`, but declared structurally here to avoid an
 * entry-point circular dependency (popover already imports from interactive
 * for `CngxCloseButton`).
 */
interface PopoverController {
  readonly isVisible: () => boolean;
  show(): void;
  hide(): void;
}

/**
 * Trigger atom for listbox dropdowns.
 *
 * Pairs a focusable element (button) with a `CngxListbox` and a `CngxPopover`
 * through explicit template references — no ancestor injection, consistent
 * with the `CngxSortHeader` / `CngxSortRef` orthogonal composition pattern.
 *
 * Implements the WAI-ARIA combobox-less listbox trigger keyboard model:
 *
 * | State | Key | Action |
 * |-|-|-|
 * | closed | Enter / Space / ArrowDown | open + highlight first enabled |
 * | closed | ArrowUp | open + highlight last enabled |
 * | open | ArrowDown / ArrowUp / Home / End | delegate to AD primitives |
 * | open | Enter / Space | activate; close if `closeOnSelect()` |
 * | any | Escape | close and restore focus to trigger |
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxListboxTrigger]',
  exportAs: 'cngxListboxTrigger',
  standalone: true,
  host: {
    '[attr.aria-haspopup]': '"listbox"',
    '[attr.aria-expanded]': 'isOpen()',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class CngxListboxTrigger<T = unknown> {
  /** Listbox controlled by this trigger. */
  readonly listbox = input.required<CngxListbox<T>>({ alias: 'cngxListboxTrigger' });
  /** Popover that wraps the listbox panel. */
  readonly popover = input.required<PopoverController>();
  /** Whether activating an option closes the popover. */
  readonly closeOnSelect = input<boolean>(true);

  /** Mirrors `CngxPopover.isVisible()` for host binding and external read. */
  readonly isOpen = computed<boolean>(() => this.popover().isVisible());

  /**
   * When a `CngxListboxSearch` is attached to the same host element, we
   * suppress the printable-character typeahead forwarding: the keystroke
   * must reach the native `<input>` value so the search directive's
   * debounced term picks it up. Without this guard every printable char
   * would be `preventDefault()`'d and the input would never receive text.
   *
   * Injected as optional + self so only co-located search declarations
   * flip the behaviour. Combobox-style triggers (where the focusable
   * element IS an `<input cngxListboxSearch cngxListboxTrigger>`) opt in
   * automatically; classic button triggers keep native-`<select>` parity.
   */
  private readonly search = inject(CngxListboxSearch, { optional: true, self: true });

  protected handleKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const ad = this.listbox().ad;

    if (!this.isOpen()) {
      if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        this.popover().show();
        ad.highlightFirst();
        return;
      }
      if (key === 'ArrowUp') {
        event.preventDefault();
        this.popover().show();
        ad.highlightLast();
        return;
      }
      return;
    }

    switch (key) {
      case 'Escape':
        event.preventDefault();
        this.popover().hide();
        return;
      case 'ArrowDown':
        event.preventDefault();
        ad.highlightNext();
        return;
      case 'ArrowUp':
        event.preventDefault();
        ad.highlightPrev();
        return;
      case 'Home':
        event.preventDefault();
        ad.highlightFirst();
        return;
      case 'End':
        event.preventDefault();
        ad.highlightLast();
        return;
      case 'Enter':
      case ' ':
        if (!ad.activeItem()) {
          return;
        }
        event.preventDefault();
        ad.activateCurrent();
        if (this.closeOnSelect()) {
          this.popover().hide();
        }
        return;
    }

    if (this.search) {
      // Input-driven trigger: let the keystroke land in the <input>
      // so CngxListboxSearch's debounced term updates.
      return;
    }
    if (key.length === 1 && /\S/.exec(key) !== null) {
      // Forward printable characters to active-descendant typeahead so the
      // select trigger behaves like a native <select>: first letter jumps
      // to the next matching option while focus stays on the trigger.
      event.preventDefault();
      ad.typeaheadChar(key);
    }
  }
}
