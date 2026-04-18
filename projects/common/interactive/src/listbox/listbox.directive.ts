import {
  afterNextRender,
  computed,
  contentChildren,
  Directive,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import type { CngxListboxSearch } from './listbox-search.directive';
import { CngxOption } from './option.directive';

/**
 * Composite listbox primitive built on top of `CngxActiveDescendant`.
 *
 * Reads options from content children, exposes single- or multi-value
 * selection state via two-way `[(value)]` / `[(selectedValues)]` bindings, and
 * drives `aria-selected` / `aria-multiselectable` reactively.
 *
 * `value` and `selectedValues` are `model()` signals — `[value]`,
 * `(valueChange)`, and `[(value)]` bindings all work identically. Forms
 * integration (`<cngx-form-field>`) is bolted on via the sibling
 * `CngxListboxFieldBridge` directive from `@cngx/forms/field` — this atom
 * stays Forms-agnostic.
 *
 * ### Material / CDK equivalent
 *
 * - `cdk-listbox` (single/multi select via `cdkListbox` directive)
 * - `mat-selection-list` (multi select list from `@angular/material/list`)
 *
 * ### Why better than Material
 *
 * 1. Single source of truth for ARIA: every attribute is a `computed()`.
 * 2. Selection shares the same `CngxActiveDescendant` used by menus and
 *    comboboxes — one mental model for all typeahead widgets.
 * 3. `isAllSelected` and `selectedLabels` are derived signals, not manual
 *    callbacks.
 * 4. Forms integration is decoupled: the listbox never imports `@angular/forms`.
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
      inputs: [
        'items',
        'orientation',
        'loop',
        'typeahead',
        'autoHighlightFirst',
        'virtualCount',
      ],
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

  /** Two-way single-value binding. */
  readonly value = model<unknown>(undefined);

  /** Two-way multi-value binding. */
  readonly selectedValues = model<unknown[]>([]);

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

  /**
   * When `true`, the listbox stops auto-writing its own `value` / `selectedValues`
   * on AD-activation. The consumer (typically a Level-3 composite like
   * `CngxSelect` running an async `[commitAction]`) fully owns the value
   * mutation flow and can intercept activations BEFORE any write happens.
   *
   * **Why this exists.**
   * The commit flow needs to snapshot the pre-pick value synchronously when
   * the user clicks an option — to roll back to it on error. Without this
   * flag, CngxListbox writes `value` via two-way binding BEFORE the consumer's
   * own `ad.activated` subscriber runs, and the pre-pick value is already
   * gone by the time we try to snapshot it. Flipping this flag lets the
   * consumer be the single writer.
   *
   * Default `false` preserves the self-contained listbox behaviour used
   * everywhere outside the select family.
   */
  readonly externalActivation = input<boolean>(false);

  /**
   * Underlying `CngxActiveDescendant` host directive. Exposed so triggers
   * (e.g. `CngxListboxTrigger`) can drive navigation without ancestor injection.
   */
  readonly ad = inject(CngxActiveDescendant, { self: true, host: true });

  /**
   * Optional explicit option list. When set, takes precedence over content
   * projection. Useful for composites that project options via `<ng-content>`
   * and query them one layer up (e.g. `CngxSelect`'s declarative mode).
   */
  readonly explicitOptions = input<readonly CngxOption[] | undefined>(undefined);

  /** Options collected via content projection. */
  private readonly contentOptions = contentChildren(CngxOption, { descendants: true });

  /** Effective option list: explicit input wins, otherwise content-projection. */
  readonly options = computed<readonly CngxOption[]>(
    () => this.explicitOptions() ?? this.contentOptions(),
  );

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

  /** Current selection as an array (single-mode → `[value]` or `[]`, multi-mode → `selectedValues`). */
  readonly selected = computed<unknown[]>(() => {
    if (this.multiple()) {
      return [...this.selectedValues()];
    }
    const v = this.value();
    return v === undefined || v === null ? [] : [v];
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
      this.selectedValues.set([...this.selectedValues(), value]);
    } else {
      this.value.set(value);
    }
  }

  /** Remove `value` from the selection. No-op if not selected. */
  deselect(value: unknown): void {
    const eq = this.compareWith();
    if (this.multiple()) {
      this.selectedValues.set(this.selectedValues().filter((v) => !eq(v, value)));
    } else if (eq(this.value(), value)) {
      this.value.set(undefined);
    }
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
    if (this.multiple()) {
      this.selectedValues.set([]);
    } else {
      this.value.set(undefined);
    }
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
    this.selectedValues.set(values);
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

  private handleActivation(value: unknown): void {
    // See `externalActivation` — when the consumer opts in, we become
    // activation-only (AD still fires `activated` on the Subject, but we
    // don't write our own value). Consumers listen on `ad.activated`
    // themselves and do the write after they've captured whatever they
    // need (for example, the pre-pick value as a rollback target).
    if (this.externalActivation()) {
      return;
    }
    if (this.multiple()) {
      this.toggle(value);
    } else {
      this.select(value);
    }
  }
}
