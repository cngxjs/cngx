import {
  afterNextRender,
  computed,
  contentChildren,
  Directive,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import type { CngxListboxSearch } from './listbox-search.directive';
import { CngxOption } from './option.directive';

/**
 * Composite listbox primitive built on top of `CngxActiveDescendant`.
 *
 * Reads options from content children, exposes single- or multi-value
 * selection state, and emits `valueChange` / `selectedValuesChange` on
 * mutations. Supports both controlled (`[value]` / `[selectedValues]`) and
 * uncontrolled usage — when both forms are bound, the controlled input wins.
 *
 * The listbox does not own overlay/popover logic — pair with
 * `CngxListboxTrigger` for dropdown-style use cases.
 *
 * ### Material / CDK equivalent
 *
 * - `cdk-listbox` (single/multi select via `cdkListbox` directive)
 * - `mat-selection-list` (multi select list from `@angular/material/list`)
 *
 * ### Why better than Material
 *
 * 1. Single source of truth for ARIA: every attribute is a `computed()`.
 * 2. Selection is built on the same `CngxActiveDescendant` used by menus and
 *    comboboxes — one mental model for all typeahead widgets.
 * 3. `isAllSelected` and `selectedLabels` are derived signals, not manual
 *    callbacks.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxListbox]',
  exportAs: 'cngxListbox',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxActiveDescendant,
      inputs: ['orientation', 'loop', 'typeahead', 'autoHighlightFirst', 'virtualCount'],
    },
  ],
  host: {
    role: 'listbox',
    '[attr.aria-label]': 'label()',
    '[attr.aria-multiselectable]': 'multiple() ? "true" : null',
  },
})
export class CngxListbox {
  /** Accessible label for the listbox region. */
  readonly label = input.required<string>();

  /** Controlled single-value input. When set, overrides internal selection. */
  readonly value = input<unknown>(undefined);

  /** Controlled multi-value input. When set, overrides internal selection. */
  readonly selectedValues = input<unknown[] | undefined>(undefined);

  /** Whether multiple options can be selected. */
  readonly multiple = input<boolean>(false);

  /** Equality function for matching values. Defaults to `Object.is`. */
  readonly compareWith = input<(a: unknown, b: unknown) => boolean>(Object.is);

  /**
   * Optional explicit reference to a `CngxListboxSearch` whose term drives
   * `filteredOptions`. Consumers wire this up with a template reference:
   * `[cngxSearchRef]="search"` and `#search="cngxListboxSearch"`. No ancestor
   * injection — orthogonal composition, like `CngxSortHeader` + `CngxSortRef`.
   */
  readonly cngxSearchRef = input<CngxListboxSearch | null>(null);

  /** Emits when the single-value selection changes. */
  readonly valueChange = output<unknown>();

  /** Emits when the multi-value selection changes. */
  readonly selectedValuesChange = output<unknown[]>();

  private readonly ad = inject(CngxActiveDescendant, { self: true, host: true });

  /** Options collected via content projection. */
  readonly options = contentChildren(CngxOption, { descendants: true });

  /** Internal selection state. Controlled inputs take precedence in `selected()`. */
  private readonly selectedState = signal<unknown[]>([]);

  /** Whether content-children have been initialised (guards effects from running early). */
  private readonly initialized = signal(false);

  constructor() {
    afterNextRender(() => this.initialized.set(true));

    // Propagate selection back to options so they can render aria-selected.
    effect(() => {
      if (!this.initialized()) {
        return;
      }
      const selected = this.selected();
      const eq = this.compareWith();
      for (const opt of this.options()) {
        opt.markSelected(selected.some((s) => eq(s, opt.value())));
      }
    });

    // Bridge AD activations into selection mutations.
    this.ad.activated.subscribe((value) => this.handleActivation(value));
  }

  /** Effective selection: controlled inputs win over internal state. */
  readonly selected = computed<unknown[]>(() => {
    if (this.multiple()) {
      const controlled = this.selectedValues();
      if (controlled) {
        return [...controlled];
      }
    } else {
      const controlled = this.value();
      if (controlled !== undefined) {
        return [controlled];
      }
    }
    return this.selectedState();
  });

  /** Labels of currently selected options, in selection order. */
  readonly selectedLabels = computed<string[]>(() => {
    const selected = this.selected();
    const eq = this.compareWith();
    const opts = this.options();
    const labels: string[] = [];
    for (const value of selected) {
      const opt = opts.find((o) => eq(o.value(), value));
      if (opt) {
        labels.push(opt.resolvedLabel());
      }
    }
    return labels;
  });

  /** Convenience: first selected label (for trigger-style displays). */
  readonly selectedLabel = computed<string | null>(() => this.selectedLabels()[0] ?? null);

  /** Whether every non-disabled option is selected. */
  readonly isAllSelected = computed<boolean>(() => {
    const opts = this.options();
    const selectable = opts.filter((o) => !o.disabled());
    if (selectable.length === 0) {
      return false;
    }
    const selected = this.selected();
    const eq = this.compareWith();
    return selectable.every((o) => selected.some((s) => eq(s, o.value())));
  });

  /** Whether the listbox has no options at all. */
  readonly isEmpty = computed<boolean>(() => this.options().length === 0);

  /** Current search term (empty when no `cngxSearchRef` is bound). */
  readonly searchTerm = computed<string>(() => this.cngxSearchRef()?.term() ?? '');

  /** Options filtered by `searchTerm` through the search matcher. */
  readonly filteredOptions = computed(() => {
    const term = this.searchTerm();
    const search = this.cngxSearchRef();
    if (term === '' || !search) {
      return this.options();
    }
    const matchFn = search.matchFn();
    return this.options().filter((opt) =>
      matchFn(
        {
          id: opt.id,
          value: opt.value(),
          label: opt.resolvedLabel(),
          disabled: opt.disabled(),
        },
        term,
      ),
    );
  });

  /** Whether the current search term matches at least one option. */
  readonly hasSearchResults = computed<boolean>(() => this.filteredOptions().length > 0);

  /**
   * Select the given value. In single mode, replaces the current selection.
   * In multi mode, adds to the selection if not already present. Values that
   * do not correspond to any option are ignored.
   */
  select(value: unknown): void {
    if (!this.hasOption(value)) {
      return;
    }
    if (this.multiple()) {
      if (this.isSelected(value)) {
        return;
      }
      const next = [...this.selectedState(), value];
      this.commit(next);
    } else {
      this.commit([value]);
    }
  }

  /** Remove `value` from the selection. No-op if not selected. */
  deselect(value: unknown): void {
    const eq = this.compareWith();
    const next = this.selectedState().filter((v) => !eq(v, value));
    this.commit(next);
  }

  /** Flip selection state for `value`. */
  toggle(value: unknown): void {
    if (this.isSelected(value)) {
      this.deselect(value);
    } else {
      this.select(value);
    }
  }

  /** Clear all selections. */
  clear(): void {
    this.commit([]);
  }

  /**
   * Select every non-disabled option. Only valid in multi mode — in single
   * mode this is a no-op.
   */
  selectAll(): void {
    if (!this.multiple()) {
      return;
    }
    const values = this.options()
      .filter((o) => !o.disabled())
      .map((o) => o.value());
    this.commit(values);
  }

  /** Returns the resolved label for a value, or `null` if no such option. */
  getLabel(value: unknown): string | null {
    const eq = this.compareWith();
    const opt = this.options().find((o) => eq(o.value(), value));
    return opt ? opt.resolvedLabel() : null;
  }

  /** Whether `value` is currently part of the selection. */
  isSelected(value: unknown): boolean {
    const eq = this.compareWith();
    return this.selected().some((v) => eq(v, value));
  }

  private hasOption(value: unknown): boolean {
    const eq = this.compareWith();
    return this.options().some((o) => eq(o.value(), value));
  }

  private commit(next: unknown[]): void {
    this.selectedState.set(next);
    if (this.multiple()) {
      this.selectedValuesChange.emit(next);
    } else {
      this.valueChange.emit(next[0] ?? null);
    }
  }

  private handleActivation(value: unknown): void {
    if (this.multiple()) {
      this.toggle(value);
    } else {
      this.select(value);
    }
  }
}
