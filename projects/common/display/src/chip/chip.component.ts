import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

/**
 * Chip / tag molecule — a small, self-contained pill rendering projected
 * content plus an optional close affordance.
 *
 * **Why this exists.**
 * Multi-value triggers (`CngxMultiSelect` today; `CngxMultiCombobox`,
 * `CngxTagInput`, toolbar filter-chips tomorrow) all want the same pill
 * surface and the same remove interaction. Inlining `<span>`/`<button>`
 * pairs per consumer (a) duplicates ARIA wiring and (b) defeats
 * atomic-decompose: ejecting a parent component drags a block of raw
 * markup into the consumer's source instead of a clean molecule.
 *
 * **Responsibilities (intentionally narrow).**
 * - Render projected `<ng-content>` as the chip label.
 * - Render a close button when `removable()` is true, emit `(remove)`
 *   on click.
 * - Provide a stable DOM id for ARIA wiring (auto-generated or
 *   consumer-supplied).
 *
 * **Non-responsibilities.**
 * - Selection state — parent tracks which value(s) are picked.
 * - Commit/async behaviour — remove simply fires an event; the parent
 *   decides whether to write state directly or route through a commit
 *   flow. This keeps the chip usable from any level of the stack.
 *
 * @category display
 */
@Component({
  selector: 'cngx-chip',
  exportAs: 'cngxChip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './chip.component.css',
  host: {
    class: 'cngx-chip',
    '[attr.id]': 'resolvedId()',
  },
  template: `
    <span class="cngx-chip__label">
      <ng-content />
    </span>
    @if (removable()) {
      <button
        type="button"
        class="cngx-chip__remove"
        [attr.aria-label]="removeAriaLabel()"
        (click)="handleRemoveClick($event)"
      >
        <!--
          Named content slot for the close glyph. Default renders the
          library's × — consumers project any icon component by tagging
          it with the attribute:

            <cngx-chip [removable]="true">
              Label
              <my-icon cngxChipClose name="cross" />
            </cngx-chip>

          Kept as an ng-content slot (not an input TemplateRef) so
          consumers can drop in their own component instances without
          the TemplateRef/outlet dance.
        -->
        <ng-content select="[cngxChipClose]">
          <span aria-hidden="true">&#10005;</span>
        </ng-content>
      </button>
    }
  `,
})
export class CngxChip {
  /**
   * Whether the close button is rendered. Typed as `boolean` — bind a
   * signal getter (`[removable]="!select.disabled()"`) if the flag
   * needs to react to upstream state.
   */
  readonly removable = input<boolean>(false);

  /**
   * Optional DOM id. When unset, a stable auto-id (`cngx-chip-N`) is
   * applied so `aria-describedby` / `aria-labelledby` hooks from the
   * parent can reference the chip.
   */
  readonly id = input<string | null>(null);

  /**
   * A11y label for the close button. Defaults to a generic "Remove";
   * consumers with option labels on hand should supply something more
   * specific (e.g. `"Remove Red"`) so screen readers know which chip
   * the button removes.
   */
  readonly removeAriaLabel = input<string>('Remove');

  /** Fires when the user clicks the close button. */
  readonly remove = output<MouseEvent>();

  private readonly autoId = nextUid('cngx-chip');

  /** @internal — resolved DOM id for host binding. */
  protected readonly resolvedId = computed<string>(() => this.id() ?? this.autoId);

  /** @internal — delegates to the output; kept as a method so the click handler stays in the template. */
  protected handleRemoveClick(event: MouseEvent): void {
    this.remove.emit(event);
  }
}
