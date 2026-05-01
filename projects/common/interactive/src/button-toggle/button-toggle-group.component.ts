import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';
import {
  CNGX_BUTTON_TOGGLE_GROUP,
  type CngxButtonToggleGroupContract,
} from './button-toggle-group.token';

/**
 * Single-select button-toggle group. Owns a `value = model<T |
 * undefined>` (the canonical single-value source) and exposes the
 * parent contract via `CNGX_BUTTON_TOGGLE_GROUP`. Behaves as a W3C
 * APG `radiogroup` — arrow keys move focus AND select (auto-select
 * variant); Tab + programmatic focus do not select on focus alone;
 * Space and Enter select the currently-focused toggle.
 *
 * Mode is **static**: this component is the single-select half of a
 * deliberate split (per `feedback_select_family_split`). Consumers
 * pick `<cngx-button-toggle-group>` for radiogroup semantics or
 * `<cngx-button-multi-toggle-group>` for toolbar semantics — never a
 * runtime `[selectionMode]` flag, never a shape-shifter. The leaf
 * `CngxButtonToggle` injects EITHER this token OR
 * `CNGX_BUTTON_MULTI_TOGGLE_GROUP` (`{ optional: true }` on both)
 * and chooses its ARIA pattern at injection time, not at runtime.
 *
 * Auto-select wiring follows the same Pillar-§6 contract as
 * `CngxRadioGroup`: a transient `pendingArrowSelect` plain-field flag
 * is raised on host `(keydown)` for any roving-relevant key
 * (Arrow*, Home, End); each focused leaf consumes the flag in its
 * `(focus)` handler via `consumePendingArrowSelect()`. The signal
 * write happens inside a DOM event handler — never inside an
 * `effect()`.
 *
 * @example
 * ```html
 * <cngx-button-toggle-group [(value)]="view" name="layout">
 *   <button cngxButtonToggle value="grid">Grid</button>
 *   <button cngxButtonToggle value="list">List</button>
 *   <button cngxButtonToggle value="table">Table</button>
 * </cngx-button-toggle-group>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-button-toggle-group, [cngxButtonToggleGroup]',
  exportAs: 'cngxButtonToggleGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
  ],
  host: {
    class: 'cngx-button-toggle-group',
    role: 'radiogroup',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-errormessage]': 'invalid() ? errorMessageId() || null : null',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.name]': 'name()',
    '[class.cngx-button-toggle-group--horizontal]':
      'orientation() === "horizontal"',
    '(keydown)': 'handleKeydown($event)',
  },
  providers: [
    { provide: CNGX_BUTTON_TOGGLE_GROUP, useExisting: CngxButtonToggleGroup },
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxButtonToggleGroup },
  ],
  template: `<ng-content />`,
  styleUrl: './button-toggle-group.component.css',
})
export class CngxButtonToggleGroup<T = unknown>
  implements CngxButtonToggleGroupContract<T>, CngxControlValue<T | undefined>
{
  readonly value = model<T | undefined>(undefined);
  readonly disabled = model<boolean>(false);
  readonly required = model<boolean>(false);
  readonly invalid = model<boolean>(false);
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input.required<string>();
  readonly nameInput = input<string | undefined>(undefined, { alias: 'name' });

  private readonly fallbackName = nextUid('cngx-button-toggle-group');
  readonly name = computed(() => this.nameInput() ?? this.fallbackName);

  private pendingArrowSelect = false;

  consumePendingArrowSelect(value: T): boolean {
    if (!this.pendingArrowSelect) {
      return false;
    }
    this.pendingArrowSelect = false;
    if (this.disabled()) {
      return false;
    }
    this.value.set(value);
    return true;
  }

  protected handleKeydown(event: Event): void {
    const key = (event as KeyboardEvent).key;
    this.pendingArrowSelect =
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'Home' ||
      key === 'End';
  }
}
