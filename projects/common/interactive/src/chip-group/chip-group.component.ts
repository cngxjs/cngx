import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldControl,
} from '@cngx/core/tokens';
import { nextUid, type CngxAsyncState } from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';
import { CNGX_ERROR_AGGREGATOR } from '../error-aggregator/error-aggregator.token';
import {
  CNGX_CHIP_GROUP_HOST,
  type CngxChipGroupHost,
} from './chip-group-host.token';

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
 * `<cngx-multi-chip-group>` for multi-pick semantics — never a
 * runtime `[selectionMode]` flag.
 *
 * `value` is a structural alias of `selected` so the group satisfies
 * `CngxControlValue<T | undefined>` without owning two synchronised
 * models — both names point to the same `ModelSignal<T | undefined>`
 * instance. Mirrors `CngxCheckboxGroup`'s `selectedValues` / `value`
 * pairing.
 *
 * `[state]` accepts `CngxAsyncState<unknown>` for async-loaded chip
 * lists; reactively drives `aria-busy` so AT announces the busy
 * moment without consumer wiring. Slot directives for
 * skeleton/empty/error are deferred — the harmonized Phase 3-4 group
 * surface ships only the `aria-busy` projection of `[state]`, and
 * chip-group follows that precedent for cross-family consistency
 * (plan deviation 2026-05-01: skeleton/empty/error slot directives
 * declared in the plan body are dropped at execute time pending a
 * cross-family harmonization pass).
 *
 * Per Pillar 1 (Ableitung statt Verwaltung), `aria-busy` is a
 * `computed()` from `state.status()` — never a manual write. Per
 * Pillar 3 (Komposition statt Konfiguration), the group composes
 * `CngxRovingTabindex` and emits no implicit children — consumers
 * project chip rows themselves.
 *
 * @example
 * ```html
 * <cngx-chip-group label="Size" [(selected)]="size">
 *   <cngx-chip cngxChipInGroup [value]="'sm'">Small</cngx-chip>
 *   <cngx-chip cngxChipInGroup [value]="'md'">Medium</cngx-chip>
 *   <cngx-chip cngxChipInGroup [value]="'lg'">Large</cngx-chip>
 * </cngx-chip-group>
 * ```
 *
 * @category interactive
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
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-errormessage]': 'invalid() ? errorMessageId() || null : null',
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
  styleUrl: './chip-group.component.css',
})
export class CngxChipGroup<T = unknown>
  implements
    CngxControlValue<T | undefined>,
    CngxChipGroupHost<T>,
    CngxFormFieldControl
{
  readonly selected = model<T | undefined>(undefined);
  readonly value = this.selected;
  readonly disabled = model<boolean>(false);
  readonly required = model<boolean>(false);
  readonly invalid = model<boolean>(false);
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input<string | undefined>(undefined);
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** CngxChipGroupHost — leaf-side cascade source. */
  readonly isDisabled = this.disabled;

  protected readonly ariaBusy = computed(
    () => this.state()?.status() === 'loading',
  );

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

  // ── CngxFormFieldControl ─────────────────────────────────────────

  readonly id = signal(nextUid('cngx-chip-group-')).asReadonly();

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /** Empty when no chip is selected. */
  readonly empty = computed(() => this.selected() === undefined);

  private readonly fieldHost = inject(CNGX_FORM_FIELD_HOST, { optional: true });
  private readonly errorAggregator = inject(CNGX_ERROR_AGGREGATOR, {
    optional: true,
    skipSelf: true,
  });

  readonly errorState = computed<boolean>(
    () =>
      this.fieldHost?.showError() ??
      this.errorAggregator?.shouldShow() ??
      false,
  );

  protected handleFocusIn(): void {
    this.focusedState.set(true);
  }

  protected handleFocusOut(): void {
    this.focusedState.set(false);
    this.fieldHost?.markAsTouched();
  }
}
