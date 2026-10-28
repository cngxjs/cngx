import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';

import { injectHostInteractionBlocked } from '../async-click/host-interaction-blocked';

import type { CngxListbox } from './listbox.directive';
import { CngxListboxSearch } from './listbox-search.directive';

/**
 * Minimum popover contract this trigger expects. Matches `CngxPopover` from
 * `@cngx/common/popover`, but declared structurally here to avoid an
 * entry-point circular dependency (popover imports from interactive, for
 * `CngxSwipeDismiss` and the listbox among others).
 */
interface PopoverController {
  readonly isVisible: () => boolean;
  show(): void;
  hide(): void;
  /**
   * Escape policy of the popover (`CngxPopover.closeOnEscape`). When it
   * reports `false` the trigger leaves Escape alone.
   */
  readonly closeOnEscape?: () => boolean;
}

/**
 * Trigger atom for listbox dropdowns.
 *
 * Pairs a focusable element (button) with a `CngxListbox` and a `CngxPopover`
 * through explicit template references - no ancestor injection, consistent
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
 * On an `<input>` host with a co-located `CngxListboxSearch` (a combobox),
 * Space, Home and End are text-editing keys: they reach the input, open or
 * closed. Enter still activates and the arrows still navigate.
 *
 * Keys from an interactive descendant of the host (a chip remove button)
 * are left to that element.
 *
 * Pair it with `CngxPopoverTrigger` on the same element: that directive is
 * the one writer of `aria-haspopup`, `aria-expanded` and `aria-controls`.
 * This trigger writes none of them.
 *
 * The trigger keeps DOM focus, so it carries `aria-activedescendant`: the
 * listbox's active option id while the popover is open, no attribute while
 * closed (ARIA 1.2 combobox). It is the only writer of the attribute on
 * the trigger host; the listbox keeps its own for focus-in-listbox setups.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/listbox/listbox-trigger.directive.ts
 * @since 0.1.0
 * @relatedTo CngxListbox, CngxListboxSearch, CngxPopoverTrigger, CngxActiveDescendant
 * <example-url>http://localhost:4200/#/common/interactive/listbox/trigger/select-dropdown</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxListboxTrigger]',
  exportAs: 'cngxListboxTrigger',
  standalone: true,
  host: {
    '[attr.aria-activedescendant]': 'activeDescendant()',
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

  /** Mirrors `CngxPopover.isVisible()` for external read. */
  readonly isOpen = computed<boolean>(() => this.popover().isVisible());

  /** Active option id while open, `null` while closed. */
  protected readonly activeDescendant = computed<string | null>(() =>
    this.isOpen() ? this.listbox().ad.activeId() : null,
  );

  /**
   * Fires when the user presses Backspace on an empty input. Only
   * emitted when the host element is an `<input>` with a co-located
   * `CngxListboxSearch` - the tag-input convention "Backspace on empty
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

  /** A disabled `cngxButton` stays focusable, so keydown still reaches the trigger. */
  private readonly hostGuard = injectHostInteractionBlocked();

  constructor() {
    effect(() => {
      if (this.hostGuard.blocked() && this.isOpen()) {
        untracked(() => this.popover().hide());
      }
    });
  }

  protected handleKeydown(event: KeyboardEvent): void {
    // Never hijack browser/app shortcuts: Ctrl/Cmd/Alt combos pass through
    // untouched - the same guard the nav strategies apply. Without it,
    // Ctrl+ArrowDown on a trigger would navigate and swallow the event.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Keys from an interactive descendant (a chip remove button, a clear
    // button) belong to that element. No preventDefault, so Enter / Space
    // still run the native button activation instead of opening the panel.
    const host = this.el.nativeElement;
    const target = event.target as Element | null;
    const interactive = target?.closest('button, a[href], input, [role="button"]');
    if (interactive && interactive !== host && host.contains(interactive)) {
      return;
    }

    const key = event.key;
    const ad = this.listbox().ad;

    // Tag-input convention: Backspace on an empty co-located search input
    // emits backspaceOnEmpty for the parent composite (CngxCombobox, …)
    // to delete the trailing chip. Consolidated here so the trigger owns
    // the only keydown handler on the element. Non-input triggers skip
    // this path via the co-located-search guard.
    // A held key repeats: only the first press may strip a chip.
    if (key === 'Backspace' && this.search && !event.repeat) {
      if (host instanceof HTMLInputElement && host.value === '') {
        this.backspaceOnEmpty.emit();
        // No preventDefault - the consumer's chip-remove path owns DOM impact.
      }
    }

    // A combobox input keeps its text-editing keys: Space types a space,
    // Home / End move the caret.
    const editingKey = this.search !== null && (key === ' ' || key === 'Home' || key === 'End');
    if (editingKey) {
      return;
    }

    if (!this.isOpen()) {
      if (this.hostGuard.isBlockedNow()) {
        return;
      }
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
        if (this.popover().closeOnEscape?.() === false) {
          return;
        }
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
