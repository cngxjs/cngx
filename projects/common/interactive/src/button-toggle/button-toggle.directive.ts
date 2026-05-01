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
 * parent must be present; the leaf throws a dev-mode error
 * otherwise. The present token determines:
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
  private readonly singleGroup = inject<CngxButtonToggleGroupContract<T>>(
    CNGX_BUTTON_TOGGLE_GROUP,
    { optional: true },
  );
  private readonly multiGroup = inject<CngxButtonMultiToggleGroupContract<T>>(
    CNGX_BUTTON_MULTI_TOGGLE_GROUP,
    { optional: true },
  );

  readonly value = input.required<T>();
  readonly disabled = input<boolean>(false);

  private readonly multiSelected = computed(() =>
    this.multiGroup ? this.multiGroup.isSelected(this.value())() : false,
  );

  protected readonly toggleChecked = computed(() => {
    if (this.singleGroup) {
      return this.singleGroup.value() === this.value();
    }
    return this.multiSelected();
  });

  protected readonly toggleDisabled = computed(() => {
    const parent = this.singleGroup ?? this.multiGroup;
    return (parent?.disabled() ?? false) || this.disabled();
  });

  protected readonly ariaChecked = computed(() =>
    this.singleGroup ? (this.toggleChecked() ? 'true' : 'false') : null,
  );

  protected readonly ariaSelected = computed(() =>
    this.multiGroup ? (this.toggleChecked() ? 'true' : 'false') : null,
  );

  constructor() {
    if (!this.singleGroup && !this.multiGroup) {
      throw new Error(
        'CngxButtonToggle requires a parent CngxButtonToggleGroup or ' +
          'CngxButtonMultiToggleGroup to provide the value contract.',
      );
    }
  }

  protected handleFocus(): void {
    if (this.toggleDisabled()) {
      return;
    }
    if (this.singleGroup) {
      this.singleGroup.consumePendingArrowSelect(this.value());
    }
  }

  protected handleSelect(): void {
    if (this.toggleDisabled()) {
      return;
    }
    if (this.singleGroup) {
      this.singleGroup.value.set(this.value());
      return;
    }
    this.multiGroup!.toggle(this.value());
  }

  protected handleKeydown(event: Event): void {
    if (this.toggleDisabled()) {
      return;
    }
    event.preventDefault();
    if (this.singleGroup) {
      this.singleGroup.value.set(this.value());
      return;
    }
    this.multiGroup!.toggle(this.value());
  }
}
