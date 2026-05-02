import {
  Directive,
  afterNextRender,
  computed,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
} from '@angular/core';
import {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldControl,
} from '@cngx/core/tokens';
import { nextUid } from '@cngx/core/utils';

import { CNGX_CHIP_GROUP_HOST } from '../chip-group/chip-group-host.token';
import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';
import { CNGX_ERROR_AGGREGATOR } from '../error-aggregator/error-aggregator.token';

/**
 * Standalone interactive chip — applies onto `<cngx-chip>` from
 * `@cngx/common/display` and wires `role="option"` selection
 * semantics with a local-owned form-bound boolean. Provides
 * `CNGX_CONTROL_VALUE` so `CngxFormBridge` (Phase 7) can adapt it
 * to Reactive Forms and `<cngx-form-field [field]>` paths can drive
 * it through Signal Forms.
 *
 * **Use this when** the chip stands alone (e.g. a removable filter
 * tag, a single suggestion chip outside any chip-group). For chips
 * inside a `<cngx-chip-group>` / `<cngx-multi-chip-group>`, use
 * `[cngxChipInGroup]` instead — that variant derives `selected`
 * from the parent's selection controller as a `computed()`,
 * eliminating the dual-source-of-truth a local model would create.
 * A dev-mode guard (via `afterNextRender`) throws if a standalone
 * chip is mistakenly nested inside a group.
 *
 * **Naming note.** The `CngxControlValue<boolean>` contract requires
 * a `value: ModelSignal<boolean>` field; the plan's API surface
 * uses `[(selected)]` for the form state and `[value]` for the
 * chip's payload. Double aliasing reconciles both: the form-bound
 * `value` field is aliased to template binding `[(selected)]`, and
 * the payload `chipValue` field is aliased to template binding
 * `[value]`. Consumers write
 * `<cngx-chip cngxChipInteraction [value]="x" [(selected)]="b">`
 * unchanged.
 *
 * **A11y.** `role="option"` + reactive `aria-selected`,
 * `aria-disabled`, and `tabindex` (-1 when disabled, 0 otherwise).
 * Click + Space + Enter toggle. Backspace + Delete fire
 * `removeRequest` — an output, NOT a state mutation. The consumer
 * decides whether removing the chip means dropping it from a list,
 * deselecting, or something else.
 *
 * **Close-button click guard.** The display chip's own
 * `<button class="cngx-chip__remove">` is a child of the host; its
 * click event bubbles. `handleClick` short-circuits when the click
 * originates from inside that button so the chip's own `(click)`
 * toggle does not double-fire alongside the chip's `(remove)`
 * output.
 *
 * **Disabled "why".** No internal sr-only span is rendered (no
 * template to inject one into). Consumers wanting a reason
 * announcement render the description element themselves and pass
 * its id via `[describedBy]` — mirrors `CngxButtonToggle`'s
 * directive-form pattern.
 *
 * @example
 * ```html
 * <cngx-chip cngxChipInteraction [value]="'red'" [(selected)]="redOn">
 *   Red
 * </cngx-chip>
 *
 * <span id="chip-locked-reason" hidden>Tag is locked by your role</span>
 * <cngx-chip
 *   cngxChipInteraction
 *   [value]="tag"
 *   [(selected)]="picked"
 *   [removable]="true"
 *   (removeRequest)="onRemoveTag(tag)"
 *   [disabled]="locked()"
 *   cngxDescribedBy="chip-locked-reason"
 * >{{ tag }}</cngx-chip>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxChipInteraction]',
  exportAs: 'cngxChipInteraction',
  standalone: true,
  host: {
    class: 'cngx-chip-interaction',
    role: 'option',
    '[attr.id]': 'id()',
    '[attr.aria-selected]': 'value() ? "true" : "false"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': 'errorMessageId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[class.cngx-chip-interaction--selected]': 'value()',
    '[class.cngx-chip-interaction--disabled]': 'disabled()',
    '(click)': 'handleClick($event)',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
    '(keydown.delete)': 'handleRemoveKeydown($event)',
    '(keydown.backspace)': 'handleRemoveKeydown($event)',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxChipInteraction },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxChipInteraction },
  ],
})
export class CngxChipInteraction<T = unknown>
  implements CngxControlValue<boolean>, CngxFormFieldControl
{
  /**
   * Chip payload — required identifier the consumer associates with
   * this chip (e.g. a tag string, filter id, entity reference). The
   * directive does not inspect or compare it; it is forwarded to
   * `(removeRequest)` listeners and visible in the DOM via the
   * consumer's own bindings. Aliased so consumers write `[value]="x"`
   * — see naming note in the class JSDoc.
   */
  readonly chipValue = input.required<T>({ alias: 'value' });

  /**
   * Form-bound selection state. Aliased so consumers write
   * `[(selected)]="b"`; the field name is `value` to satisfy the
   * `CngxControlValue<boolean>` contract used by `CngxFormBridge`
   * (Phase 7). See class JSDoc.
   */
  readonly value = model<boolean>(false, { alias: 'selected' });

  readonly disabled = model<boolean>(false);
  readonly invalid = model<boolean>(false);
  readonly errorMessageId = input<string | null>(null);
  readonly describedBy = input<string | null>(null, {
    alias: 'cngxDescribedBy',
  });

  /** Fires on Backspace/Delete keydown — consumer owns the removal. */
  readonly removeRequest = output<void>();

  // ── CngxFormFieldControl ─────────────────────────────────────────

  readonly id = signal(nextUid('cngx-chip-')).asReadonly();

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /** Empty when the chip is unselected — boolean atom semantics. */
  readonly empty = computed(() => this.value() === false);

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

  constructor() {
    if (!isDevMode()) {
      return;
    }
    const ancestor = inject(CNGX_CHIP_GROUP_HOST, {
      optional: true,
      skipSelf: true,
    });
    afterNextRender(() => {
      if (ancestor !== null) {
        throw new Error(
          'CngxChipInteraction must NOT be used inside <cngx-chip-group> / <cngx-multi-chip-group>; use [cngxChipInGroup] instead.',
        );
      }
    });
  }

  protected handleClick(event: MouseEvent): void {
    if (this.disabled() || isCloseButtonClick(event)) {
      return;
    }
    this.value.update((v) => !v);
  }

  protected handleKeydown(event: Event): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.value.update((v) => !v);
  }

  protected handleRemoveKeydown(event: Event): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.removeRequest.emit();
  }

  protected handleFocusIn(): void {
    this.focusedState.set(true);
  }

  protected handleFocusOut(): void {
    this.focusedState.set(false);
    this.fieldHost?.markAsTouched();
  }
}

function isCloseButtonClick(event: Event): boolean {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  return target.closest('.cngx-chip__remove') !== null;
}
