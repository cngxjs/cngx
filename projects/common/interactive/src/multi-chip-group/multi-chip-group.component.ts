import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';
import {
  CNGX_CHIP_GROUP_HOST,
  type CngxChipGroupHost,
} from '../chip-group/chip-group-host.token';

/**
 * Multi-select chip group. Owns a `selectedValues = model<T[]>([])`
 * (the canonical multi-value source) and exposes the parent contract
 * via `CNGX_CHIP_GROUP_HOST`. Behaves as a `role="listbox"
 * aria-multiselectable="true"` with `CngxRovingTabindex`-driven
 * keyboard navigation; consumers project `<cngx-chip cngxChipInGroup>`
 * children that derive their own `aria-selected` from this group's
 * `isSelected(value)`.
 *
 * Mode is **static** per `feedback_select_family_split`: this is the
 * multi-select half of the chip-group split.
 *
 * Internals lean on `createSelectionController` from `@cngx/core/utils`
 * for membership tracking — the controller's structural-equality
 * `selected` snapshot prevents downstream computed cascades from
 * thrashing when a re-emission produces the same logical contents
 * with a different array reference. Mirrors `CngxCheckboxGroup`'s
 * controller wiring.
 *
 * `value` is a structural alias of `selectedValues` so the group
 * satisfies `CngxControlValue<T[]>` without owning two synchronised
 * models — both names point to the same `ModelSignal<T[]>` instance.
 *
 * `[keyFn]` lets consumers with object-typed values map each value
 * to a stable membership key (typically `(v) => v.id`). Without it,
 * membership uses identity / primitive equality.
 *
 * `[state]` accepts `CngxAsyncState<unknown>` for async-loaded chip
 * lists; reactively drives `aria-busy`. Slot directives for
 * skeleton/empty/error are deferred — the harmonized Phase 3-4 group
 * surface ships only the `aria-busy` projection of `[state]`, and
 * chip-group follows that precedent for cross-family consistency
 * (plan deviation 2026-05-01: see `CngxChipGroup` JSDoc).
 *
 * **Roving strategy (accepted-debt §5).** This molecule uses
 * `CngxRovingTabindex` (per the harmonized Phase 3-4 group precedent),
 * NOT `createChipStripRoving`. The strip-roving controller would solve
 * clamp-on-removal automatically but its tabindex contract requires
 * the parent to bind `[attr.tabindex]` per chip wrapper at the
 * template level — which a content-projected `CngxChipInGroup` leaf
 * model does not allow. Tracked in `form-primitives-accepted-debt §5`;
 * UX consequence is a one-shot focus reset to index 0 after
 * mid-strip removal, instead of clamping to the next valid sibling.
 *
 * **Removal flow (plan deviation).** Plan revision claimed
 * `createChipRemovalHandler` from `@cngx/forms/select` would drive
 * the remove path. That import is a layer violation
 * (`@cngx/common/interactive` is Level 2; `@cngx/forms/select` is
 * Level 3). Removal here is a thin `controller.deselect(value)` —
 * the WeakMap-closure-cache machinery in the select-family handler
 * targets `ngTemplateOutlet` chip-slot stability, which content-
 * projected chip-in-group leaves do not exhibit.
 *
 * Per Pillar 1 (Ableitung statt Verwaltung), `aria-busy` is a
 * `computed()` from `state.status()`. Per Pillar 3 (Komposition
 * statt Konfiguration), the group composes `CngxRovingTabindex` and
 * emits no implicit children — consumers project chip rows themselves.
 *
 * @example
 * ```html
 * <cngx-multi-chip-group label="Tags" [(selectedValues)]="tags">
 *   @for (tag of options(); track tag) {
 *     <cngx-chip cngxChipInGroup [value]="tag">{{ tag }}</cngx-chip>
 *   }
 * </cngx-multi-chip-group>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-multi-chip-group, [cngxMultiChipGroup]',
  exportAs: 'cngxMultiChipGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
  ],
  host: {
    class: 'cngx-multi-chip-group',
    role: 'listbox',
    'aria-multiselectable': 'true',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-errormessage]': 'invalid() ? errorMessageId() || null : null',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-multi-chip-group--horizontal]':
      'orientation() === "horizontal"',
  },
  providers: [
    { provide: CNGX_CHIP_GROUP_HOST, useExisting: CngxMultiChipGroup },
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxMultiChipGroup },
  ],
  template: `<ng-content />`,
  styleUrl: './multi-chip-group.component.css',
})
export class CngxMultiChipGroup<T = unknown>
  implements CngxControlValue<T[]>, CngxChipGroupHost<T>
{
  readonly selectedValues = model<T[]>([]);
  readonly value = this.selectedValues;
  readonly disabled = model<boolean>(false);
  readonly required = model<boolean>(false);
  readonly invalid = model<boolean>(false);
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input<string | undefined>(undefined);
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);
  readonly keyFn = input<(value: T) => unknown>((v) => v);

  /** CngxChipGroupHost — leaf-side cascade source. */
  readonly isDisabled = this.disabled;

  private readonly controller: SelectionController<T> = inject(
    CNGX_SELECTION_CONTROLLER_FACTORY,
  )<T>(this.selectedValues, {
    keyFn: (v) => this.keyFn()(v),
  });

  protected readonly ariaBusy = computed(
    () => this.state()?.status() === 'loading',
  );

  /** Public membership count — useful for label hints + announcements. */
  readonly selectedCount = this.controller.selectedCount;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller.destroy());
  }

  isSelected(value: T): boolean {
    return this.controller.isSelected(value)();
  }

  toggle(value: T): void {
    if (this.disabled()) {
      return;
    }
    this.controller.toggle(value);
  }

  remove(value: T): void {
    if (this.disabled()) {
      return;
    }
    this.controller.deselect(value);
  }
}
