import { Directive, computed, inject, input } from '@angular/core';
import { CngxRovingItem } from '@cngx/common/a11y';

import {
  CNGX_BUTTON_TOGGLE_GROUP,
  type CngxButtonToggleGroupContract,
} from './button-toggle-group.token';

/**
 * Single button-toggle leaf. Restricted to `<button>` elements via
 * the `button[cngxButtonToggle]` selector so consumers cannot
 * accidentally apply the directive to a `<div>` and lose the
 * native button semantics (Space + Enter activation, focus ring,
 * disabled propagation to the form-submission engine).
 *
 * Injects the parent group via `CNGX_BUTTON_TOGGLE_GROUP` (token,
 * never the concrete `CngxButtonToggleGroup` class) and writes
 * `group.value.set(this.value())` when the user picks it. Checked-
 * ness is derived: `aria-checked = group.value() === this.value()`.
 *
 * Composes `CngxRovingItem` as a host directive with input
 * forwarding (`'cngxRovingItemDisabled: disabled'`) so arrow-key
 * navigation in the parent group (driven by `CngxRovingTabindex`)
 * skips per-toggle-disabled leaves automatically. The leaf's own
 * `disabled = input<boolean>(false)` flows into both the
 * `[disabled]` host binding (native button-disable) AND the roving
 * directive's skip-test.
 *
 * Selection on click, Space, or Enter; auto-select also fires on
 * arrow-nav via `consumePendingArrowSelect` (W3C APG radiogroup
 * variant). Tab and programmatic focus do not select on focus
 * alone.
 *
 * Phase 4 commit 3 extends this directive to also accept
 * `CNGX_BUTTON_MULTI_TOGGLE_GROUP` so the same leaf serves both
 * the single and multi groups; the present token determines
 * `aria-checked` (single) vs `aria-selected` (multi) AT INJECTION
 * TIME, never at runtime.
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
    '[attr.aria-checked]': 'toggleChecked() ? "true" : "false"',
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
  protected readonly group = inject<CngxButtonToggleGroupContract<T>>(
    CNGX_BUTTON_TOGGLE_GROUP,
  );

  readonly value = input.required<T>();
  readonly disabled = input<boolean>(false);

  protected readonly toggleChecked = computed(
    () => this.group.value() === this.value(),
  );

  protected readonly toggleDisabled = computed(
    () => this.group.disabled() || this.disabled(),
  );

  protected handleFocus(): void {
    if (this.toggleDisabled()) {
      return;
    }
    this.group.consumePendingArrowSelect(this.value());
  }

  protected handleSelect(): void {
    if (this.toggleDisabled()) {
      return;
    }
    this.group.value.set(this.value());
  }

  protected handleKeydown(event: Event): void {
    if (this.toggleDisabled()) {
      return;
    }
    event.preventDefault();
    this.group.value.set(this.value());
  }
}
