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
 * Multi-select segmented control: a `toolbar` of `cngxButtonToggle` buttons that each add or
 * remove one value in `selectedValues`.
 *
 * Arrow keys, Home and End only move focus. Click, Space and Enter toggle the button they hit,
 * which reports its state with `aria-pressed`. For exactly one value use
 * `CngxButtonToggleGroup`; the leaf is the same, the group decides its mode.
 *
 * Membership runs through the controller from `CNGX_SELECTION_CONTROLLER_FACTORY` (default
 * `createSelectionController`), keyed by `keyFn`. Override the token to swap it for a subtree.
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
 * @relatedTo CngxButtonToggle, CngxButtonToggleGroup
 * <example-url>/#/common/interactive/button-toggle/multi-group/basic-multi-filter-toolbar</example-url>
 * <example-url>/#/common/interactive/button-toggle/multi-group/disabled-group-cascade-vs-per-toggle</example-url>
 * <example-url>/#/forms/field/form-primitives/coming-in-a-follow-up</example-url>
 * <example-url>/#/forms/field/form-primitives/reactive-forms-same-atom-just-bind-formcontrol</example-url>
 * <example-url>/#/forms/field/form-primitives/signal-forms-drop-the-atom-into-cngx-form-field</example-url>
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
  /**
   * Values of the toggled-on buttons, compared by `keyFn`. Two-way bindable with
   * `[(selectedValues)]`. Default `[]`.
   */
  readonly selectedValues = model<T[]>([]);
  /**
   * The `selectedValues` model under the name `CNGX_CONTROL_VALUE` readers expect. Not a template
   * input: bind `[(selectedValues)]`.
   */
  readonly value = this.selectedValues;
  /**
   * Disables every toggle in the group: each toggle combines it with its own
   * `disabled`, `toggle` becomes a no-op and the host sets `aria-disabled="true"`.
   * Default `false`.
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
   * adds the `cngx-button-multi-toggle-group--horizontal` class. The same binding is
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
  /**
   * Maps a value to the key used for membership checks, for example `(v) => v.id` for
   * object values so re-fetched instances with the same id still match. Default is the
   * identity function.
   */
  readonly keyFn = input<(value: T) => unknown>((v) => v);

  private readonly controller: SelectionController<T> = inject(
    CNGX_SELECTION_CONTROLLER_FACTORY,
  )<T>(this.selectedValues, {
    keyFn: (v) => this.keyFn()(v),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller.destroy());
  }

  /**
   * Signal that is true while a value with the same `keyFn` key as `value` is in
   * `selectedValues`. `CngxButtonToggle` reads it for `aria-pressed`.
   */
  isSelected(value: T): Signal<boolean> {
    return this.controller.isSelected(value);
  }

  /**
   * Adds `value` to `selectedValues`, or removes it when its key is already there. Does nothing
   * while `disabled`. `CngxButtonToggle` calls it on click, Space and Enter.
   */
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

  /** Generated host id, written to the `id` attribute. */
  readonly id = this.groupHost.id;

  /** True while focus is inside the group. */
  readonly focused = this.groupHost.focused;

  /** Empty when no toggles are selected. */
  readonly empty = computed(() => this.selectedValues().length === 0);

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
