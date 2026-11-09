import {
  afterNextRender,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  type OutputRef,
} from '@angular/core';
import { CNGX_NESTED_INTERACTIVE_SELECTOR } from '@cngx/core/utils';

import { CngxSearch } from '../keyboard/search.directive';
import { injectHostInteractionBlocked } from '../trigger-guard/host-interaction-blocked';
import { onPopoverClosed } from '../trigger-guard/on-popover-closed';

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
  /**
   * Close event of the popover (`CngxPopover.closed`). When present, every
   * close resets the highlight, also one the trigger did not start.
   */
  readonly closed?: OutputRef<void>;
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
 * ### Blocked host
 *
 * A blocked host opens on no key: native `disabled`, `aria-disabled="true"`,
 * or a co-hosted cngx button reporting `disabled` (a disabled `cngxButton`
 * stays focusable, so keydown still arrives). When a cngx button becomes
 * disabled while the panel is open, the panel closes, and a blocked
 * combobox input emits no `backspaceOnEmpty`. The trigger guards only the
 * keys it handles: a `(click)="pop.toggle()"` on a plain button is the
 * consumer's and must check the blocked state itself; a `cngxButton` host
 * swallows that click on its own.
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
 * <example-url>/#/common/interactive/listbox/trigger/select-dropdown</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxListboxTrigger]',
  exportAs: 'cngxListboxTrigger',
  standalone: true,
  host: {
    '[attr.aria-activedescendant]': 'activeDescendant()',
    '(keydown)': 'handleKeydown($event)',
    '(blur)': 'handleBlur()',
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
  /** The co-located debounce owner, present whenever `search` is. Used to settle a pending term. */
  private readonly searchCtrl = inject(CngxSearch, { optional: true, self: true });
  private readonly injector = inject(Injector);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** A disabled `cngxButton` stays focusable, so keydown still reaches the trigger. */
  private readonly hostGuard = injectHostInteractionBlocked({
    isOpen: () => this.isOpen(),
    close: () => this.popover().hide(),
  });

  /** Descendants that own Enter / Space; `CNGX_NESTED_INTERACTIVE_SELECTOR`. */
  private readonly nestedInteractive = inject(CNGX_NESTED_INTERACTIVE_SELECTOR);

  constructor() {
    // An outside click or a light dismiss closes the panel past closePanel();
    // the close event resets the highlight for those as well.
    onPopoverClosed(
      () => this.popover(),
      () => this.listbox().ad.resetHighlight(),
    );
  }

  protected handleKeydown(event: KeyboardEvent): void {
    // ARIA combobox Alt shortcuts: Alt+ArrowDown opens the panel without moving
    // the highlight, Alt+ArrowUp closes it. Every other Ctrl/Meta/Alt combo is a
    // browser or app shortcut and passes through untouched - the same guard the
    // nav strategies apply.
    if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      if (event.key === 'ArrowDown' && !this.isOpen() && !this.hostGuard.isBlockedNow()) {
        event.preventDefault();
        this.popover().show();
        return;
      }
      if (event.key === 'ArrowUp' && this.isOpen()) {
        event.preventDefault();
        this.closePanel();
        return;
      }
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Keys pressed during an IME composition belong to the IME: the Enter that
    // confirms a candidate must not pick an option, and the arrows move
    // through the candidate list. Safari reports the confirming Enter with
    // `isComposing: false` and keyCode 229, hence both checks.
    if (event.isComposing || event.keyCode === 229) {
      return;
    }

    // Keys from an interactive descendant (a chip remove button, a clear
    // button) belong to that element. No preventDefault, so Enter / Space
    // still run the native button activation instead of opening the panel.
    const host = this.el.nativeElement;
    const target = event.target as Element | null;
    const interactive = target?.closest(this.nestedInteractive);
    if (interactive && interactive !== host && host.contains(interactive)) {
      return;
    }

    const key = event.key;

    // Tag-input convention: Backspace on an empty co-located search input
    // emits backspaceOnEmpty for the parent composite (CngxCombobox, …)
    // to delete the trailing chip. Consolidated here so the trigger owns
    // the only keydown handler on the element. Non-input triggers skip
    // this path via the co-located-search guard.
    // A held key repeats: only the first press may strip a chip. A blocked
    // host strips none.
    if (key === 'Backspace' && this.search && !event.repeat && !this.hostGuard.isBlockedNow()) {
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
      // An editable combobox (co-located search) leaves a closed Enter to the
      // form: the native implicit submit must run, opening belongs to
      // Alt+ArrowDown. Space already reached the input as an editing key above.
      // The highlight goes first, so a handler of the popover's `opened`
      // output (a host opening on its selected option) can replace it in the
      // same task. A deferred-render panel holds no rows yet; the active
      // descendant keeps the gesture until they render.
      const openKeys =
        key === 'ArrowDown' || (!this.search && (key === 'Enter' || key === ' '));
      if (openKeys) {
        event.preventDefault();
        this.listbox().ad.highlightFirst();
        this.popover().show();
        return;
      }
      if (key === 'ArrowUp') {
        event.preventDefault();
        this.listbox().ad.highlightLast();
        this.popover().show();
        return;
      }
      return;
    }

    // A combobox input with a debounced term still pending settles it before a
    // navigation or activation key, then runs the key after the next render so
    // the listbox reflects the filtered options - the stale-filter rule the
    // declarative search already applies. A button trigger has no co-located
    // search, so this never fires for it.
    if (this.searchCtrl && this.isNavOrActivate(key) && this.searchCtrl.flush()) {
      event.preventDefault();
      afterNextRender(() => this.runOpenKey(key, null), { injector: this.injector });
      return;
    }
    this.runOpenKey(key, event);
  }

  /** Whether `key` navigates or activates the open listbox. */
  private isNavOrActivate(key: string): boolean {
    return (
      key === 'ArrowDown' ||
      key === 'ArrowUp' ||
      key === 'Home' ||
      key === 'End' ||
      key === 'Enter' ||
      key === ' '
    );
  }

  /** Flush a pending debounced term when focus leaves the trigger. */
  protected handleBlur(): void {
    this.searchCtrl?.flush();
  }

  /**
   * Close the panel and reset the active-descendant highlight, so the closed
   * listbox element carries no stale `aria-activedescendant` and a reopen
   * starts fresh (ARIA 1.2 combobox, I10). The listbox is popover-free and
   * cannot observe the close itself, so the trigger owns the reset.
   */
  private closePanel(): void {
    this.popover().hide();
    this.listbox().ad.resetHighlight();
  }

  /** The open-panel key actions. `event` is `null` when run deferred after a flush. */
  private runOpenKey(key: string, event: KeyboardEvent | null): void {
    const ad = this.listbox().ad;
    switch (key) {
      case 'Escape':
        if (this.popover().closeOnEscape?.() === false) {
          return;
        }
        event?.preventDefault();
        this.closePanel();
        return;
      case 'ArrowDown':
        event?.preventDefault();
        ad.highlightNext();
        return;
      case 'ArrowUp':
        event?.preventDefault();
        ad.highlightPrev();
        return;
      case 'Home':
        event?.preventDefault();
        ad.highlightFirst();
        return;
      case 'End':
        event?.preventDefault();
        ad.highlightLast();
        return;
      case 'Enter':
      case ' ':
        if (!ad.activeItem()) {
          // Space on a button trigger scrolls the page by default; with the
          // panel open it belongs to the listbox even when nothing is active.
          // Enter stays untouched so a consumer's own Enter handler still runs.
          if (key === ' ') {
            event?.preventDefault();
          }
          return;
        }
        event?.preventDefault();
        ad.activateCurrent();
        if (this.closeOnSelect()) {
          this.closePanel();
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
      event?.preventDefault();
      ad.typeaheadChar(key);
    }
  }
}
