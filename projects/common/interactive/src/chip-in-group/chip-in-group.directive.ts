import { Directive, computed, inject, input, model } from '@angular/core';
import { CngxRovingItem } from '@cngx/common/a11y';

import {
  CNGX_CHIP_GROUP_HOST,
  type CngxChipGroupHost,
} from '../chip-group/chip-group-host.token';

/**
 * In-group chip leaf — applies onto `<cngx-chip>` from
 * `@cngx/common/display` and wires `role="option"` semantics that
 * defer all selection mutations to the surrounding chip-group via
 * `CNGX_CHIP_GROUP_HOST`. Required parent (NOT optional): a
 * `[cngxChipInGroup]` outside any group throws `NullInjectorError`
 * at construction. Standalone interactive chips use
 * `[cngxChipInteraction]` instead.
 *
 * **No local model.** `selected` is a `computed()` reading
 * `parent.isSelected(value())`; the chip never holds its own
 * selection state. This is the fix for the dual-source-of-truth
 * problem flagged in `cngx-plan-review` (form-primitives §1) — a
 * single value-flow per directive: the parent's selection
 * controller is canonical, the leaf is a pure projection of it.
 *
 * **Activation.** Click + Space + Enter call `parent.toggle(value())`.
 * Delete + Backspace call `parent.remove(value())`. Close-button
 * clicks bubbling from `<cngx-chip>`'s internal remove button are
 * filtered so the chip's `(click)` toggle does not double-fire
 * alongside the chip's own `(remove)` output.
 *
 * **Roving composition.** Composes `CngxRovingItem` as a host
 * directive with `disabled` forwarding so arrow-key navigation in
 * the parent (driven by `CngxRovingTabindex` on `<cngx-chip-group>`
 * / `<cngx-multi-chip-group>`) skips per-chip-disabled leaves
 * automatically. Same pattern as `CngxRadio` and `CngxButtonToggle`.
 *
 * **Group-disabled cascade vs roving (accepted debt §4).** The
 * group-level `[disabled]` cascade short-circuits `handleSelect` /
 * `handleRemove` (see `chipDisabled` computed), but does NOT
 * propagate into `CngxRovingItem.disabled` — Angular forbids
 * re-binding a host-directive's read-only `InputSignal`. As a
 * result, a fully-disabled group lets visual focus transit through
 * its chips via Arrow keys; every selection / remove pathway
 * short-circuits silently. Behaviour mirrors `CngxRadio` and
 * `CngxButtonToggle`; tracked in `form-primitives-accepted-debt §4`.
 * Re-evaluation is gated on `CngxRovingItem.disabled` becoming a
 * writable surface in `@cngx/common/a11y`.
 *
 * **Disabled "why".** No internal sr-only span — the directive
 * applies onto a projected `<cngx-chip>` and has no template.
 * Consumers wanting a reason announcement render the description
 * element themselves and pass its id via `[describedBy]`. Same
 * pattern as `CngxButtonToggle` / `CngxChipInteraction`.
 *
 * @example
 * ```html
 * <cngx-chip-group [(selected)]="size" label="Size">
 *   <cngx-chip cngxChipInGroup [value]="'sm'">Small</cngx-chip>
 *   <cngx-chip cngxChipInGroup [value]="'md'">Medium</cngx-chip>
 *   <cngx-chip cngxChipInGroup [value]="'lg'">Large</cngx-chip>
 * </cngx-chip-group>
 *
 * <cngx-multi-chip-group [(selectedValues)]="tags" label="Tags">
 *   @for (tag of tags(); track tag) {
 *     <cngx-chip
 *       cngxChipInGroup
 *       [value]="tag"
 *       [removable]="true"
 *     >{{ tag }}</cngx-chip>
 *   }
 * </cngx-multi-chip-group>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxChipInGroup]',
  exportAs: 'cngxChipInGroup',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxRovingItem,
      inputs: ['cngxRovingItemDisabled: disabled'],
    },
  ],
  host: {
    class: 'cngx-chip-in-group',
    role: 'option',
    '[attr.aria-selected]': 'selected() ? "true" : "false"',
    '[attr.aria-disabled]': 'chipDisabled() ? "true" : null',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.cngx-chip-in-group--selected]': 'selected()',
    '[class.cngx-chip-in-group--disabled]': 'chipDisabled()',
    '(click)': 'handleClick($event)',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
    '(keydown.delete)': 'handleRemove($event)',
    '(keydown.backspace)': 'handleRemove($event)',
  },
})
export class CngxChipInGroup<T = unknown> {
  protected readonly parent = inject<CngxChipGroupHost<T>>(
    CNGX_CHIP_GROUP_HOST,
    { host: true },
  );

  readonly value = input.required<T>();
  readonly disabled = model<boolean>(false);
  readonly describedBy = input<string | null>(null, {
    alias: 'cngxDescribedBy',
  });

  protected readonly selected = computed(() =>
    this.parent.isSelected(this.value()),
  );

  protected readonly chipDisabled = computed(
    () => this.parent.isDisabled() || this.disabled(),
  );

  protected handleClick(event: MouseEvent): void {
    if (this.chipDisabled() || isCloseButtonClick(event)) {
      return;
    }
    this.parent.toggle(this.value());
  }

  protected handleKeydown(event: Event): void {
    if (this.chipDisabled()) {
      return;
    }
    event.preventDefault();
    this.parent.toggle(this.value());
  }

  protected handleRemove(event: Event): void {
    if (this.chipDisabled()) {
      return;
    }
    event.preventDefault();
    this.parent.remove(this.value());
  }
}

function isCloseButtonClick(event: Event): boolean {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  return target.closest('.cngx-chip__remove') !== null;
}
