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
 * Single-select segmented control: a `radiogroup` of `cngxButtonToggle` buttons bound with
 * `[(value)]`. Arrow keys, Home and End move focus and select, like `CngxRadioGroup`; focus from
 * Tab or `focus()` does not select.
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
 * @relatedTo CngxButtonToggle, CngxRadioGroup, CngxButtonMultiToggleGroup, CngxButtonGroup, CngxRovingTabindex, CngxChipGroup
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
  /** Selected toggle value, `undefined` when none. */
  readonly value = model<T | undefined>(undefined);
  /** Disables every toggle; arrow-key focus does not select while set. */
  readonly disabled = model<boolean>(false);
  /** Only sets `aria-required`; the group does not validate. */
  readonly required = model<boolean>(false);
  /** Sets `aria-invalid`. A `model`, so form bridges can write it. */
  readonly invalid = model<boolean>(false);
  /**
   * Emitted as `aria-errormessage`; render the element yourself. Ignored while `aria-invalid` is
   * unset, so a fixed id is safe on a valid group.
   */
  readonly errorMessageId = input<string | null>(null);
  /** Arrow-key axis of the host `CngxRovingTabindex`, reflected as `aria-orientation`. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Emitted as `aria-label`; a non-empty label replaces the `cngx-form-field` label reference. */
  readonly label = input<string | undefined>(undefined);

  /** Emitted as `aria-labelledby`; wins over the `cngx-form-field` label. */
  readonly labelledBy = input<string | undefined>(undefined);
  /**
   * Sets `aria-busy` while `'loading'`. Unbound or a bare attribute falls back to the nearest
   * `CNGX_STATEFUL` provider.
   */
  readonly state = input<
    CngxAsyncState<unknown> | undefined,
    CngxAsyncState<unknown> | '' | undefined
  >(undefined, { transform: (v) => (typeof v === 'string' ? undefined : v) });

  private readonly roving = inject(CngxRovingTabindex, { host: true });

  /**
   * Selects `value` and returns `true` after an arrow, Home or End focus, unless the group or
   * `leafDisabled` is disabled. Clears the roving flag on every call.
   */
  consumePendingArrowSelect(value: T, leafDisabled = false): boolean {
    if (!this.roving.consumeNavigationKey()) {
      return false;
    }
    if (this.disabled() || leafDisabled) {
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

  /** Generated host id. */
  readonly id = this.groupHost.id;

  /** True while focus is inside the group. */
  readonly focused = this.groupHost.focused;

  /** True when no toggle is selected. */
  readonly empty = computed(() => this.value() === undefined);

  /** True while the surrounding `cngx-form-field` or a `CngxErrorAggregator` shows an error. */
  readonly errorState = this.groupHost.errorState;

  protected handleFocusIn(): void {
    this.groupHost.handleFocusIn();
  }

  protected handleFocusOut(): void {
    this.groupHost.handleFocusOut();
  }
}
