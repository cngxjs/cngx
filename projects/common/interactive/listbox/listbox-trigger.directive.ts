import { computed, Directive, ElementRef, inject, input, output } from '@angular/core';

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
 * <example-url>http://localhost:4200/#/common/interactive/listbox/trigger/select-dropdown</example-url>
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
   * Fires when the user presses Backspace on an empty input. Only
   * emitted when the host element is an `<input>` with a co-located
   * `CngxListboxSearch` — the tag-input convention "Backspace on empty
   * deletes the trailing chip" lives at the trigger, so consumers only
   * wire one subscription to own the delete path. On non-input hosts
   * (classic button triggers) the event never fires.
   */
  readonly backspaceOnEmpty = output<void>();

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
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  protected handleKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const ad = this.listbox().ad;

    // Tag-input convention: Backspace on an empty co-located search input
    // emits backspaceOnEmpty for the parent composite (CngxCombobox, …)
    // to delete the trailing chip. Consolidated here so the trigger owns
    // the only keydown handler on the element. Non-input triggers skip
    // this path via the co-located-search guard.
    if (key === 'Backspace' && this.search) {
      const host = this.el.nativeElement;
      if (host instanceof HTMLInputElement && host.value === '') {
        this.backspaceOnEmpty.emit();
        // No preventDefault — the consumer's chip-remove path owns DOM impact.
      }
    }

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
      // Let the keystroke reach the <input> for CngxListboxSearch debounce.
      return;
    }
    if (key.length === 1 && /\S/.exec(key) !== null) {
      // Native <select> parity: printable chars drive AD typeahead while
      // focus stays on the trigger.
      event.preventDefault();
      ad.typeaheadChar(key);
    }
  }
}
