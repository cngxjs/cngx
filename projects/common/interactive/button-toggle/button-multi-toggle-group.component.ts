import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  type Signal,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import { CNGX_FORM_FIELD_CONTROL, type CngxFormFieldControl } from '@cngx/core/tokens';
import {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';

import { CNGX_CONTROL_VALUE, type CngxControlValue } from '../control-value/control-value.token';
import { injectInteractiveGroupHost } from '../group-host/group-host';
import {
  CNGX_BUTTON_MULTI_TOGGLE_GROUP,
  type CngxButtonMultiToggleGroupContract,
} from './button-multi-toggle-group.token';

/**
 * Multi-select segmented control: a `toolbar` of `cngxButtonToggle` buttons bound with
 * `[(selectedValues)]`. Arrow keys, Home and End only move focus.
 *
 * Membership runs through `CNGX_SELECTION_CONTROLLER_FACTORY`, keyed by `keyFn`; override the
 * token to swap the controller for a subtree.
 *
 * ```html
 * <cngx-button-multi-toggle-group label="Filters" [(selectedValues)]="filters">
 *   <button cngxButtonToggle value="open">Open</button>
 *   <button cngxButtonToggle value="closed">Closed</button>
 *   <button cngxButtonToggle value="archived">Archived</button>
 * </cngx-button-multi-toggle-group>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-multi-toggle-group.component.ts
 * @selector cngx-button-multi-toggle-group
 * @since 0.1.0
 * @relatedTo CngxButtonToggle, CngxButtonToggleGroup, CngxCheckboxGroup, CngxMultiChipGroup, CNGX_SELECTION_CONTROLLER_FACTORY, CngxRovingTabindex
 * <example-url>/#/common/interactive/button-toggle/multi-group/basic-multi-filter-toolbar</example-url>
 * <example-url>/#/common/interactive/button-toggle/multi-group/disabled-group-cascade-vs-per-toggle</example-url>
 * <example-url>/#/forms/field/form-primitives/reactive-forms-same-atom-just-bind-formcontrol</example-url>
 * @axis level molecule
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
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': 'errorMessageId()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-button-multi-toggle-group--horizontal]': 'orientation() === "horizontal"',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
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
    {
      provide: CNGX_FORM_FIELD_CONTROL,
      useExisting: CngxButtonMultiToggleGroup,
    },
  ],
  template: `<ng-content />`,
  styleUrls: ['./button-toggle-group.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxButtonMultiToggleGroup<T = unknown>
  implements CngxButtonMultiToggleGroupContract<T>, CngxControlValue<T[]>, CngxFormFieldControl
{
  /** Toggled-on values, compared by `keyFn`. */
  readonly selectedValues = model<T[]>([]);
  /** `selectedValues` under the name `CNGX_CONTROL_VALUE` readers expect. Not an input. */
  readonly value = this.selectedValues;
  /** Disables every toggle and turns `toggle` into a no-op. */
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
  /** Membership key, for example `(v) => v.id`, so a re-fetched object still matches. */
  readonly keyFn = input<(value: T) => unknown>((v) => v);

  private readonly controller: SelectionController<T> = inject(
    CNGX_SELECTION_CONTROLLER_FACTORY,
  )<T>(this.selectedValues, {
    keyFn: (v) => this.keyFn()(v),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller.destroy());
  }

  /** True while the `keyFn` key of `value` is selected. */
  isSelected(value: T): Signal<boolean> {
    return this.controller.isSelected(value);
  }

  /** Adds or removes `value` by its `keyFn` key; a no-op while `disabled`. */
  toggle(value: T): void {
    if (this.disabled()) {
      return;
    }
    this.controller.toggle(value);
  }

  private readonly groupHost = injectInteractiveGroupHost({
    uidPrefix: 'cngx-button-multi-toggle-group-',
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
  readonly empty = computed(() => this.selectedValues().length === 0);

  /** True while the surrounding `cngx-form-field` or a `CngxErrorAggregator` shows an error. */
  readonly errorState = this.groupHost.errorState;

  protected handleFocusIn(): void {
    this.groupHost.handleFocusIn();
  }

  protected handleFocusOut(): void {
    this.groupHost.handleFocusOut();
  }
}
