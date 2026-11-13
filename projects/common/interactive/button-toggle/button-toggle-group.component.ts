import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import { CNGX_FORM_FIELD_CONTROL, type CngxFormFieldControl } from '@cngx/core/tokens';
import { type CngxAsyncState } from '@cngx/core/utils';

import { CNGX_CONTROL_VALUE, type CngxControlValue } from '../control-value/control-value.token';
import { injectInteractiveGroupHost } from '../group-host/group-host';
import {
  CNGX_BUTTON_TOGGLE_GROUP,
  type CngxButtonToggleGroupContract,
} from './button-toggle-group.token';

/**
 * Single-select segmented control: a `radiogroup` of `cngxButtonToggle` buttons with one
 * `value`.
 *
 * Arrow keys, Home and End move focus and select, like `CngxRadioGroup`. Focus from Tab or a
 * programmatic `focus()` does not select. Click, Space and Enter select the toggle they hit.
 *
 * For any number of selected values use `CngxButtonMultiToggleGroup`. The leaf is the same, the
 * group decides its mode.
 *
 * Arrow selection runs through the host `CngxRovingTabindex`, which flags a navigation key before
 * it moves focus. The focused toggle calls `consumePendingArrowSelect`, which reads that flag.
 *
 * ```html
 * <cngx-button-toggle-group label="Layout" [(value)]="view">
 *   <button cngxButtonToggle value="grid">Grid</button>
 *   <button cngxButtonToggle value="list">List</button>
 *   <button cngxButtonToggle value="table">Table</button>
 * </cngx-button-toggle-group>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-toggle-group.component.ts
 * @selector cngx-button-toggle-group
 * @since 0.1.0
 * @relatedTo CngxButtonToggle, CngxRadioGroup
 * <example-url>/#/common/interactive/button-toggle/group/basic-view-switcher</example-url>
 * <example-url>/#/common/interactive/button-toggle/group/disabled-group-cascade-vs-per-toggle</example-url>
 * <example-url>/#/common/interactive/button-toggle/group/vertical-orientation</example-url>
 * @axis level molecule
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
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': 'errorMessageId()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-button-toggle-group--horizontal]': 'orientation() === "horizontal"',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    { provide: CNGX_BUTTON_TOGGLE_GROUP, useExisting: CngxButtonToggleGroup },
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxButtonToggleGroup },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxButtonToggleGroup },
  ],
  template: `<ng-content />`,
  styleUrls: ['./button-toggle-group.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxButtonToggleGroup<T = unknown>
  implements CngxButtonToggleGroupContract<T>, CngxControlValue<T | undefined>, CngxFormFieldControl
{
  /**
   * Value of the selected toggle, or `undefined` when none is selected. Two-way
   * bindable with `[(value)]`; a toggle writes it on click, Space, Enter and arrow-key
   * focus. Default `undefined`.
   */
  readonly value = model<T | undefined>(undefined);
  /**
   * Disables every toggle in the group: each toggle combines it with its own
   * `disabled`, and the host sets `aria-disabled="true"`. Arrow-key focus does not
   * select while the group is disabled. Default `false`.
   */
  readonly disabled = model<boolean>(false);
  /**
   * Sets `aria-required="true"` on the host while true. The group performs no
   * validation itself. Default `false`.
   */
  readonly required = model<boolean>(false);
  /**
   * Sets `aria-invalid="true"` on the host. A `model` so form bridges and validity adapters can
   * write it. The surrounding field's error display sets `aria-invalid` too. Default `false`.
   */
  readonly invalid = model<boolean>(false);
  /**
   * Id of the element that holds the error message, emitted as `aria-errormessage`. Render that
   * element yourself. Assistive technology ignores the attribute while `aria-invalid` is unset, so
   * a fixed id is safe on a valid group. Default `null` omits it.
   */
  readonly errorMessageId = input<string | null>(null);
  /**
   * Layout direction of the group, reflected as `aria-orientation`; `'horizontal'` also
   * adds the `cngx-button-toggle-group--horizontal` class. The same binding is
   * forwarded to the host `CngxRovingTabindex` as its arrow-key axis. Default
   * `'horizontal'`.
   */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /**
   * Accessible name of the group, emitted as `aria-label`. A non-empty label also stops
   * the group from referencing the surrounding `cngx-form-field` label through
   * `aria-labelledby`. Default `undefined`.
   */
  readonly label = input<string | undefined>(undefined);

  /**
   * Id of the element that names the group, emitted as `aria-labelledby`. Wins over the field
   * label a `cngx-form-field` would reference.
   */
  readonly labelledBy = input<string | undefined>(undefined);
  /**
   * Async state behind `aria-busy`, which is set while its status is `'loading'`. Unbound,
   * `undefined` or a bare `state` attribute falls back to the nearest `CNGX_STATEFUL` provider.
   */
  readonly state = input<
    CngxAsyncState<unknown> | undefined,
    CngxAsyncState<unknown> | '' | undefined
  >(undefined, { transform: (v) => (typeof v === 'string' ? undefined : v) });

  private readonly roving = inject(CngxRovingTabindex, { host: true });

  /**
   * Selects `value` when the host `CngxRovingTabindex` reports that focus just moved by a
   * navigation key, and returns `true`. Returns `false` for any other focus, such as Tab, and
   * while the group is disabled. Each call clears the roving flag.
   *
   * Called by `CngxButtonToggle` from its focus handler.
   */
  consumePendingArrowSelect(value: T): boolean {
    if (!this.roving.consumeNavigationKey()) {
      return false;
    }
    if (this.disabled()) {
      return false;
    }
    this.value.set(value);
    return true;
  }

  private readonly groupHost = injectInteractiveGroupHost({
    uidPrefix: 'cngx-button-toggle-group-',
    invalid: this.invalid,
    state: this.state,
    label: this.label,
    labelledBy: this.labelledBy,
  });

  protected readonly ariaLabelledBy = this.groupHost.ariaLabelledBy;

  protected readonly ariaBusy = this.groupHost.ariaBusy;

  /** Generated host id, written to the `id` attribute. */
  readonly id = this.groupHost.id;

  /** True while focus is inside the group. */
  readonly focused = this.groupHost.focused;

  /** Empty when no toggle is selected. */
  readonly empty = computed(() => this.value() === undefined);

  /**
   * True while the surrounding `cngx-form-field`, or else a `CngxErrorAggregator`, shows an
   * error. Turns on `aria-invalid`.
   */
  readonly errorState = this.groupHost.errorState;

  protected handleFocusIn(): void {
    this.groupHost.handleFocusIn();
  }

  protected handleFocusOut(): void {
    this.groupHost.handleFocusOut();
  }
}
