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
 * Single-select button-toggle group. Owns a `value = model<T |
 * undefined>` (the canonical single-value source) and exposes the
 * parent contract via `CNGX_BUTTON_TOGGLE_GROUP`. Behaves as a W3C
 * APG `radiogroup` - arrow keys move focus AND select (auto-select
 * variant); Tab + programmatic focus do not select on focus alone;
 * Space and Enter select the currently-focused toggle.
 *
 * Mode is **static**: this component is the single-select half of a
 * deliberate split (per `feedback_select_family_split`). Consumers
 * pick `<cngx-button-toggle-group>` for radiogroup semantics or
 * `<cngx-button-multi-toggle-group>` for toolbar semantics - never a
 * runtime `[selectionMode]` flag, never a shape-shifter. The leaf
 * `CngxButtonToggle` injects EITHER this token OR
 * `CNGX_BUTTON_MULTI_TOGGLE_GROUP` (`{ optional: true }` on both)
 * and chooses its ARIA pattern at injection time, not at runtime.
 *
 * Auto-select wiring follows the same contract as `CngxRadioGroup`:
 * the host `CngxRovingTabindex` raises its navigation-key intent before
 * it moves focus; each focused leaf consumes that intent in its
 * `(focus)` handler via `consumePendingArrowSelect()`, which reads
 * `roving.consumeNavigationKey()`. Reading an already-set fact (instead
 * of a group-owned `(keydown)` flag) closes the one-press-behind race
 * (#135). The value write happens inside a DOM event handler - never
 * inside an `effect()`.
 *
 * ```html
 * <cngx-button-toggle-group label="Layout" [(value)]="view">
 *   <button cngxButtonToggle value="grid">Grid</button>
 *   <button cngxButtonToggle value="list">List</button>
 *   <button cngxButtonToggle value="table">Table</button>
 * </cngx-button-toggle-group>
 * ```
 *
 * @category common/interactive
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-toggle-group.component.ts
 * @selector cngx-button-toggle-group
 * @since 0.1.0
 * @relatedTo CngxButtonToggle, CngxRadioGroup
 * <example-url>http://localhost:4200/#/common/interactive/button-toggle/group/basic-view-switcher</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/button-toggle/group/disabled-group-cascade-vs-per-toggle</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/button-toggle/group/vertical-orientation</example-url>
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
  readonly value = model<T | undefined>(undefined);
  readonly disabled = model<boolean>(false);
  readonly required = model<boolean>(false);
  /**
   * Bridge-writable invalid state. `model<boolean>` mirrors `disabled`
   * so external integrations (RF/Signal-Forms bridges, custom validity
   * adapters) can drive it without a parallel API path - consumers
   * typically read only.
   */
  readonly invalid = model<boolean>(false);
  /**
   * Optional id of an external error message element. When set, the
   * host emits `aria-errormessage="<id>"`; consumers MUST render an
   * element with that id. Default `null` skips the attribute.
   * Note: WAI-ARIA dictates that AT ignores this attribute when
   * `aria-invalid` is absent or `"false"`, so a stable always-emitted
   * id is harmless when the field is valid.
   */
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input<string | undefined>(undefined);

  /**
   * Explicit `aria-labelledby` target id. Wins over the automatic
   * field-label reference applied inside a `cngx-form-field`.
   */
  readonly labelledBy = input<string | undefined>(undefined);
  /**
   * Optional async state driving `aria-busy`. An explicit binding wins;
   * when it is absent or `undefined`, an ancestor `CNGX_STATEFUL`
   * provider is discovered as fallback. A bare `state` attribute (empty
   * string) is treated as unset. `aria-busy` reflects
   * `status() === 'loading'`.
   */
  readonly state = input<
    CngxAsyncState<unknown> | undefined,
    CngxAsyncState<unknown> | '' | undefined
  >(undefined, { transform: (v) => (typeof v === 'string' ? undefined : v) });

  private readonly roving = inject(CngxRovingTabindex, { host: true });

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

  readonly id = this.groupHost.id;

  readonly focused = this.groupHost.focused;

  /** Empty when no toggle is selected. */
  readonly empty = computed(() => this.value() === undefined);

  readonly errorState = this.groupHost.errorState;

  protected handleFocusIn(): void {
    this.groupHost.handleFocusIn();
  }

  protected handleFocusOut(): void {
    this.groupHost.handleFocusOut();
  }
}
