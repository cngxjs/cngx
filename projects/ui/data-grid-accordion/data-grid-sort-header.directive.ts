import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { createSortHeaderState } from '@cngx/common/data';
import { nextUid } from '@cngx/core/utils';

import { CNGX_DATA_GRID_ACCORDION } from './data-grid-accordion.token';

// EN default status text. Each string describes the primary (non-additive) click
// outcome so a screen reader hears both the current sort and what activating does.
// English by default, per the library-defaults-are-English rule.
const NOT_SORTED = 'not sorted, activate to sort ascending';
const SORTED_ASCENDING = 'sorted ascending, activate to sort descending';
const SORTED_DESCENDING = 'sorted descending, activate to sort ascending';

/**
 * Makes a {@link CngxDataGridHeader} cell sort the grid it lives in with a single
 * attribute - `cngxDgaSortHeader="field"` - and no `[cngxSortRef]` plumbing. It reads
 * the group's hosted {@link CngxSort} off {@link CNGX_DATA_GRID_ACCORDION} (the seam),
 * so the header cell needs no reference to the sort instance; the group provides it.
 *
 * The cell becomes an operable control: `role="button"`, `tabindex="0"`, and
 * click / Enter / Space all toggle the column's sort through `CngxSort.setSort`. When
 * the owning group has `[multiSort]`, Shift-activating adds this column to the sort
 * stack instead of replacing it (mirrors {@link CngxSortHeader}). The field/direction
 * logic is a faithful copy of `CngxSortHeader`; that atom cannot be composed here
 * because its `cngxSortRef` is `input.required` and only template-bindable, so a
 * sibling wrapper could never feed it - the copy reads the ref off the context instead.
 *
 * The component is a disclosure accordion, not a table, so it carries no
 * `role="grid"` / `role="table"` and thus no valid context for `aria-sort` /
 * `role="columnheader"`. The sort state is instead communicated to assistive tech
 * through a visually-hidden description (always in the DOM, content reactive - Pillar 2)
 * referenced by `aria-describedby`: the accessible name stays the stable column label,
 * the description carries the live sort state. A tinted direction arrow is a CSS
 * `::after` cue (pseudo content, so it never doubles the announcement or shifts a
 * `ch`-based track). On activation the new sort state is also spoken once through the
 * shared {@link CngxLiveAnnouncer} polite region - a change announcement worded
 * distinctly from the on-focus description, for SR/browser pairs that do not re-read a
 * mutated `aria-describedby` on an already-focused control.
 *
 * ```html
 * <cngx-data-grid-accordion [multiSort]="true">
 *   <cngx-dga-header>
 *     <span cngxDgaCell col="sm" cngxDgaSortHeader="id">ID</span>
 *     <span cngxDgaCell col="grow" cngxDgaSortHeader="name">Name</span>
 *     <span cngxDgaCell col="md" align="end" cngxDgaSortHeader="amount">Amount</span>
 *   </cngx-dga-header>
 *   <!-- rows rendered by the consumer's @for over its own sorted array -->
 * </cngx-data-grid-accordion>
 * ```
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-sort-header.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxSort, CngxSortHeader, CngxDgCell
 */
@Directive({
  selector: '[cngxDgaSortHeader]',
  exportAs: 'cngxDgaSortHeader',
  standalone: true,
  host: {
    role: 'button',
    tabindex: '0',
    class: 'cngx-dga-sort-header',
    '[attr.aria-describedby]': 'statusId',
    '[class.cngx-dga-sort-header--active]': 'isActive()',
    '[class.cngx-dga-sort-header--asc]': 'isAsc()',
    '[class.cngx-dga-sort-header--desc]': 'isDesc()',
    '(click)': 'handleSort($event)',
    '(keydown.enter)': 'handleSort($event)',
    '(keydown.space)': 'handleActivateKey($event)',
  },
})
export class CngxDgaSortHeader {
  /** The field key this header cell sorts by. */
  readonly field = input.required<string>({ alias: 'cngxDgaSortHeader' });

  /** SR status while unsorted. English default; override for other locales. */
  readonly notSortedLabel = input(NOT_SORTED, { alias: 'cngxDgaSortStatusNotSorted' });
  /** SR status while sorted ascending. English default; override for other locales. */
  readonly ascendingLabel = input(SORTED_ASCENDING, { alias: 'cngxDgaSortStatusAscending' });
  /** SR status while sorted descending. English default; override for other locales. */
  readonly descendingLabel = input(SORTED_DESCENDING, { alias: 'cngxDgaSortStatusDescending' });

  /**
   * Human column name spoken in the live sort announcement (`{label}` placeholder
   * of the announcement templates). Defaults to the field key.
   */
  readonly label = input<string | undefined>(undefined, { alias: 'cngxDgaSortLabel' });
  /** Live announcement fired when this column becomes sorted ascending. `{label}` is replaced. */
  readonly ascendingAnnouncement = input('Sorted by {label} ascending', {
    alias: 'cngxDgaSortAnnounceAscending',
  });
  /** Live announcement fired when this column becomes sorted descending. `{label}` is replaced. */
  readonly descendingAnnouncement = input('Sorted by {label} descending', {
    alias: 'cngxDgaSortAnnounceDescending',
  });
  /** Live announcement fired when this column's sort is cleared. `{label}` is replaced. */
  readonly clearedAnnouncement = input('Sorting by {label} cleared', {
    alias: 'cngxDgaSortAnnounceCleared',
  });

  private readonly grid = inject(CNGX_DATA_GRID_ACCORDION);
  private readonly announcer = inject(CngxLiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  /** Stable id of the visually-hidden status element the host `aria-describedby` names. */
  protected readonly statusId = nextUid('cngx-dga-sort-status-');

  private readonly state = createSortHeaderState(() => this.grid.sort, this.field);

  /** `true` when this column is part of the active sort (primary or secondary). */
  readonly isActive = this.state.isActive;
  /** `true` when this column is active and sorted ascending. */
  readonly isAsc = this.state.isAsc;
  /** `true` when this column is active and sorted descending. */
  readonly isDesc = this.state.isDesc;

  /**
   * 1-based position of this column in the sort stack, or `0` when it is not active.
   * Only meaningful when the owning group has `[multiSort]` (for sort-order badges).
   */
  readonly priority = this.state.priority;

  private readonly statusText = computed(() => {
    if (this.isAsc()) {
      return this.ascendingLabel();
    }
    if (this.isDesc()) {
      return this.descendingLabel();
    }
    return this.notSortedLabel();
  });

  // A visually-hidden, aria-hidden description node the host `aria-describedby` names.
  // aria-hidden keeps it out of the name-from-contents walk (so the accessible name
  // stays the plain column label), while aria-describedby still reads it for the
  // description - the standard "stable name + live description" split.
  private readonly statusElement = this.createStatusElement();

  constructor() {
    // Imperative DOM sync: keep the description text tracking the sort state. No signal
    // writes, so this is a pure side effect (permitted in an effect).
    effect(() => {
      this.renderer.setProperty(this.statusElement, 'textContent', this.statusText());
    });
  }

  private createStatusElement(): HTMLElement {
    const element = this.renderer.createElement('span') as HTMLElement;
    this.renderer.setAttribute(element, 'id', this.statusId);
    this.renderer.setAttribute(element, 'aria-hidden', 'true');
    this.renderer.addClass(element, 'cngx-dga-sort-header__sr');
    this.renderer.appendChild(this.host, element);
    return element;
  }

  protected handleSort(event?: Event): void {
    this.state.toggle((event as { shiftKey?: boolean })?.shiftKey ?? false);
    // Announce the transition through the shared polite live region. Fired from the
    // handler (not an effect) so it speaks exactly once per user activation and stays
    // silent on init and on external sort changes. The always-present aria-describedby
    // node keeps the on-focus description; this is the change announcement some SR /
    // browser pairs miss when only a describedby text mutates on a focused control.
    this.announcer.announce(this.announcementText());
  }

  private announcementText(): string {
    const label = this.label() ?? this.field();
    const template = this.isAsc()
      ? this.ascendingAnnouncement()
      : this.isDesc()
        ? this.descendingAnnouncement()
        : this.clearedAnnouncement();
    return template.replace('{label}', label);
  }

  protected handleActivateKey(event: Event): void {
    // Space would scroll the grid's overflow container; suppress it and activate.
    event.preventDefault();
    this.handleSort(event);
  }
}
