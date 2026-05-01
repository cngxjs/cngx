import { Directive, computed, inject, input } from '@angular/core';
import { CngxRovingItem } from '@cngx/common/a11y';

import {
  CNGX_BUTTON_MULTI_TOGGLE_GROUP,
  type CngxButtonMultiToggleGroupContract,
} from './button-multi-toggle-group.token';
import {
  CNGX_BUTTON_TOGGLE_GROUP,
  type CngxButtonToggleGroupContract,
} from './button-toggle-group.token';

interface SingleResolution<T> {
  readonly mode: 'single';
  readonly group: CngxButtonToggleGroupContract<T>;
}

interface MultiResolution<T> {
  readonly mode: 'multi';
  readonly group: CngxButtonMultiToggleGroupContract<T>;
}

type ParentResolution<T> = SingleResolution<T> | MultiResolution<T>;

/**
 * Button-toggle leaf. Restricted to `<button>` elements via the
 * `button[cngxButtonToggle]` selector so consumers cannot
 * accidentally apply the directive to a `<div>` and lose the
 * native button semantics (Space + Enter activation, focus ring,
 * disabled propagation to the form-submission engine).
 *
 * Injects EITHER `CNGX_BUTTON_TOGGLE_GROUP` (single, radiogroup) OR
 * `CNGX_BUTTON_MULTI_TOGGLE_GROUP` (multi, toolbar) — never the
 * concrete group class — both with `{ optional: true }`. Exactly one
 * parent must be present; the constructor throws when both or
 * neither resolve. The resolved parent is stored as a discriminated
 * union (`{ mode: 'single' | 'multi'; group }`) so every downstream
 * branch narrows without non-null assertions.
 *
 * The present token determines:
 *
 * - the ARIA pattern (`aria-checked` for single, `aria-selected` for
 *   multi), bound on the host AT INJECTION TIME,
 * - the activation contract (single: `group.value.set(...)`; multi:
 *   `group.toggle(...)`),
 * - whether `(focus)` consumes the parent's pending arrow-select
 *   flag (single only — multi follows toolbar APG, which does not
 *   auto-select on arrow nav).
 *
 * Mode is **static** per atom instance — there is no runtime
 * `[selectionMode]` flag. Per `feedback_select_family_split`,
 * single + multi are two distinct groups reusing this leaf; the
 * decision is made by the consumer at template-authoring time.
 *
 * Composes `CngxRovingItem` as a host directive with input
 * forwarding (`'cngxRovingItemDisabled: disabled'`) so arrow-key
 * navigation in either parent group skips per-toggle-disabled leaves
 * automatically.
 *
 * @category interactive
 */
@Directive({
  selector: 'button[cngxButtonToggle]',
  exportAs: 'cngxButtonToggle',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxRovingItem,
      inputs: ['cngxRovingItemDisabled: disabled'],
    },
  ],
  host: {
    class: 'cngx-button-toggle',
    type: 'button',
    '[attr.aria-checked]': 'ariaChecked()',
    '[attr.aria-selected]': 'ariaSelected()',
    '[attr.aria-disabled]': 'toggleDisabled() ? "true" : null',
    '[attr.disabled]': 'toggleDisabled() ? "" : null',
    '[class.cngx-button-toggle--checked]': 'toggleChecked()',
    '[class.cngx-button-toggle--disabled]': 'toggleDisabled()',
    '(focus)': 'handleFocus()',
    '(click)': 'handleSelect()',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
  },
})
export class CngxButtonToggle<T = unknown> {
  private readonly resolved: ParentResolution<T> = resolveParent<T>();

  readonly value = input.required<T>();
  readonly disabled = input<boolean>(false);

  protected readonly toggleChecked = computed(() => {
    if (this.resolved.mode === 'single') {
      return this.resolved.group.value() === this.value();
    }
    return this.resolved.group.isSelected(this.value())();
  });

  protected readonly toggleDisabled = computed(
    () => this.resolved.group.disabled() || this.disabled(),
  );

  protected readonly ariaChecked = computed(() =>
    this.resolved.mode === 'single'
      ? this.toggleChecked()
        ? 'true'
        : 'false'
      : null,
  );

  protected readonly ariaSelected = computed(() =>
    this.resolved.mode === 'multi'
      ? this.toggleChecked()
        ? 'true'
        : 'false'
      : null,
  );

  protected handleFocus(): void {
    if (this.toggleDisabled()) {
      return;
    }
    if (this.resolved.mode === 'single') {
      this.resolved.group.consumePendingArrowSelect(this.value());
    }
  }

  protected handleSelect(): void {
    if (this.toggleDisabled()) {
      return;
    }
    if (this.resolved.mode === 'single') {
      this.resolved.group.value.set(this.value());
      return;
    }
    this.resolved.group.toggle(this.value());
  }

  protected handleKeydown(event: Event): void {
    if (this.toggleDisabled()) {
      return;
    }
    event.preventDefault();
    if (this.resolved.mode === 'single') {
      this.resolved.group.value.set(this.value());
      return;
    }
    this.resolved.group.toggle(this.value());
  }
}

function resolveParent<T>(): ParentResolution<T> {
  const single = inject<CngxButtonToggleGroupContract<T>>(
    CNGX_BUTTON_TOGGLE_GROUP,
    { optional: true },
  );
  const multi = inject<CngxButtonMultiToggleGroupContract<T>>(
    CNGX_BUTTON_MULTI_TOGGLE_GROUP,
    { optional: true },
  );
  if (single && multi) {
    throw new Error(
      'CngxButtonToggle: both CngxButtonToggleGroup and ' +
        'CngxButtonMultiToggleGroup parents are present in the injector ' +
        'tree. Exactly one is required — single + multi semantics are ' +
        'incompatible.',
    );
  }
  if (single) {
    return { mode: 'single', group: single };
  }
  if (multi) {
    return { mode: 'multi', group: multi };
  }
  throw new Error(
    'CngxButtonToggle requires a parent CngxButtonToggleGroup or ' +
      'CngxButtonMultiToggleGroup to provide the value contract.',
  );
}
