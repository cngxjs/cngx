import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import { CNGX_FORM_FIELD_CONTROL, type CngxFormFieldControl } from '@cngx/core/tokens';
import { type CngxAsyncState } from '@cngx/core/utils';

import { CNGX_CONTROL_VALUE, type CngxControlValue } from '../control-value/control-value.token';
import { injectInteractiveGroupHost } from '../group-host/group-host';
import { CNGX_CHIP_GROUP_HOST, type CngxChipGroupHost } from './chip-group-host.token';

/**
 * Single-select chip group. Owns a `selected = model<T | undefined>`
 * (the canonical single-value source) and exposes the parent contract
 * via `CNGX_CHIP_GROUP_HOST`. Behaves as a `role="listbox"` with
 * `CngxRovingTabindex`-driven keyboard navigation; consumers project
 * `<cngx-chip cngxChipInGroup>` children that derive their own
 * `aria-selected` from this group's `isSelected(value)`.
 *
 * Mode is **static** per `feedback_select_family_split`: this is the
 * single-select half of a deliberate split. Consumers pick
 * `<cngx-chip-group>` for single-pick semantics or
 * `<cngx-multi-chip-group>` for multi-pick semantics - never a
 * runtime `[selectionMode]` flag.
 *
 * `value` is a structural alias of `selected` so the group satisfies
 * `CngxControlValue<T | undefined>` without owning two synchronised
 * models - both names point to the same `ModelSignal<T | undefined>`
 * instance. Mirrors `CngxCheckboxGroup`'s `selectedValues` / `value`
 * pairing.
 *
 * `[state]` accepts `CngxAsyncState<unknown>` for async-loaded chip
 * lists; reactively drives `aria-busy` so AT announces the busy
 * moment without consumer wiring. Slot directives for
 * skeleton/empty/error are deferred - the harmonized Phase 3-4 group
 * surface ships only the `aria-busy` projection of `[state]`, and
 * chip-group follows that precedent for cross-family consistency
 * (plan deviation 2026-05-01: skeleton/empty/error slot directives
 * declared in the plan body are dropped at execute time pending a
 * cross-family harmonization pass).
 *
 * Per Pillar 1 (Ableitung statt Verwaltung), `aria-busy` is a
 * `computed()` from `state.status()` - never a manual write. Per
 * Pillar 3 (Komposition statt Konfiguration), the group composes
 * `CngxRovingTabindex` and emits no implicit children - consumers
 * project chip rows themselves.
 *
 * ```html
 * <cngx-chip-group label="Size" [(selected)]="size">
 *   <cngx-chip cngxChipInGroup [value]="'sm'">Small</cngx-chip>
 *   <cngx-chip cngxChipInGroup [value]="'md'">Medium</cngx-chip>
 *   <cngx-chip cngxChipInGroup [value]="'lg'">Large</cngx-chip>
 * </cngx-chip-group>
 * ```
 *
 * @category common/interactive
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/chip-group/chip-group.component.ts
 * @selector cngx-chip-group
 * @since 0.1.0
 * @relatedTo CngxMultiChipGroup, CngxChipInGroup, CngxChipInteraction, CngxRadioGroup
 * <example-url>http://localhost:4200/#/common/interactive/chip/group/basic-pick-exactly-one-size</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-primitives/coming-in-a-follow-up</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-primitives/reactive-forms-same-atom-just-bind-formcontrol</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-primitives/signal-forms-drop-the-atom-into-cngx-form-field</example-url>
 */
@Component({
  selector: 'cngx-chip-group, [cngxChipGroup]',
  exportAs: 'cngxChipGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
  ],
  host: {
    class: 'cngx-chip-group',
    role: 'listbox',
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': 'errorMessageId()',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-chip-group--horizontal]': 'orientation() === "horizontal"',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    { provide: CNGX_CHIP_GROUP_HOST, useExisting: CngxChipGroup },
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxChipGroup },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxChipGroup },
  ],
  template: `<ng-content />`,
  styleUrls: ['./chip-group.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxChipGroup<T = unknown>
  implements CngxControlValue<T | undefined>, CngxChipGroupHost<T>, CngxFormFieldControl
{
  readonly selected = model<T | undefined>(undefined);
  readonly value = this.selected;
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

  /** CngxChipGroupHost - leaf-side cascade source. */
  readonly isDisabled = this.disabled;

  private readonly groupHost = injectInteractiveGroupHost({
    uidPrefix: 'cngx-chip-group-',
    invalid: this.invalid,
    state: this.state,
  });

  protected readonly ariaBusy = this.groupHost.ariaBusy;

  isSelected(value: T): boolean {
    return Object.is(this.selected(), value);
  }

  toggle(value: T): void {
    if (this.disabled()) {
      return;
    }
    if (this.isSelected(value)) {
      this.selected.set(undefined);
      return;
    }
    this.selected.set(value);
  }

  remove(value: T): void {
    if (this.disabled()) {
      return;
    }
    if (this.isSelected(value)) {
      this.selected.set(undefined);
    }
  }

  readonly id = this.groupHost.id;

  readonly focused = this.groupHost.focused;

  /** Empty when no chip is selected. */
  readonly empty = computed(() => this.selected() === undefined);

  readonly errorState = this.groupHost.errorState;

  protected handleFocusIn(): void {
    this.groupHost.handleFocusIn();
  }

  protected handleFocusOut(): void {
    this.groupHost.handleFocusOut();
  }
}
