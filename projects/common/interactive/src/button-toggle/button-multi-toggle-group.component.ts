import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  type Signal,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import {
  createSelectionController,
  type SelectionController,
} from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';
import {
  CNGX_BUTTON_MULTI_TOGGLE_GROUP,
  type CngxButtonMultiToggleGroupContract,
} from './button-multi-toggle-group.token';

/**
 * Multi-select button-toggle group. Owns a `selectedValues =
 * model<T[]>([])` (the canonical multi-value source) and exposes the
 * parent contract via `CNGX_BUTTON_MULTI_TOGGLE_GROUP`. Behaves as a
 * W3C APG `toolbar` — arrow keys MOVE focus only (no auto-select);
 * Space and Enter on a focused leaf toggle that leaf's membership.
 *
 * Mode is **static**: this is the multi-select half of the
 * deliberate single/multi split (per
 * `feedback_select_family_split`). Consumers pick this component or
 * `<cngx-button-toggle-group>` at template authoring time. Leaves
 * (`CngxButtonToggle`) inject EITHER token with `{ optional: true }`
 * and choose `aria-checked` (single) vs `aria-selected` (multi)
 * AT INJECTION TIME, never at runtime.
 *
 * Internals lean on `createSelectionController` from
 * `@cngx/core/utils` for membership tracking — the controller's
 * stable per-value `isSelected` signals (memoised by key) let leaves
 * read membership inside their own `computed()` without triggering a
 * fresh array walk on every change-detection pass.
 *
 * `value` is a structural alias of `selectedValues` so the group
 * satisfies `CngxControlValue<T[]>` without owning two synchronised
 * models — both names point to the same `ModelSignal<T[]>` instance.
 *
 * @example
 * ```html
 * <cngx-button-multi-toggle-group label="Filters" [(selectedValues)]="filters">
 *   <button cngxButtonToggle value="open">Open</button>
 *   <button cngxButtonToggle value="closed">Closed</button>
 *   <button cngxButtonToggle value="archived">Archived</button>
 * </cngx-button-multi-toggle-group>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-button-multi-toggle-group, [cngxButtonMultiToggleGroup]',
  exportAs: 'cngxButtonMultiToggleGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
  ],
  host: {
    class: 'cngx-button-multi-toggle-group',
    role: 'toolbar',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-errormessage]': 'invalid() ? errorMessageId() || null : null',
    '[attr.aria-orientation]': 'orientation()',
    '[class.cngx-button-multi-toggle-group--horizontal]':
      'orientation() === "horizontal"',
  },
  providers: [
    {
      provide: CNGX_BUTTON_MULTI_TOGGLE_GROUP,
      useExisting: CngxButtonMultiToggleGroup,
    },
    {
      provide: CNGX_CONTROL_VALUE,
      useExisting: CngxButtonMultiToggleGroup,
    },
  ],
  template: `<ng-content />`,
  styleUrl: './button-toggle-group.component.css',
})
export class CngxButtonMultiToggleGroup<T = unknown>
  implements CngxButtonMultiToggleGroupContract<T>, CngxControlValue<T[]>
{
  readonly selectedValues = model<T[]>([]);
  readonly value = this.selectedValues;
  readonly disabled = model<boolean>(false);
  readonly required = model<boolean>(false);
  readonly invalid = model<boolean>(false);
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input.required<string>();
  readonly keyFn = input<(value: T) => unknown>((v) => v);

  private readonly controller: SelectionController<T> =
    createSelectionController<T>(this.selectedValues, {
      keyFn: (v) => this.keyFn()(v),
    });

  isSelected(value: T): Signal<boolean> {
    return this.controller.isSelected(value);
  }

  toggle(value: T): void {
    if (this.disabled()) {
      return;
    }
    this.controller.toggle(value);
  }
}
