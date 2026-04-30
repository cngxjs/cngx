import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { CngxCheckboxIndicator } from '@cngx/common/display';
import { nextUid } from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';

/**
 * Single-value boolean checkbox with indeterminate support and W3C
 * `role="checkbox"` semantics. Click, Space, and Enter all advance
 * `value`; an indeterminate checkbox advances to `value=true`,
 * `indeterminate=false` in a single step (per WAI-ARIA tristate
 * semantics — there is no path that lands the checkbox back in
 * `'mixed'` from a user click).
 *
 * `value` and `indeterminate` are both `ModelSignal<boolean>` so
 * consumers can two-way-bind both: `[(value)]` for the canonical
 * checked/unchecked state, `[(indeterminate)]` for the tri-state
 * marker most often driven by a parent group's "some-but-not-all"
 * computation. `disabled` is also a `ModelSignal<boolean>` to keep
 * the `CngxFormBridge`'s `setDisabledState` write path consistent
 * across the family.
 *
 * Visual indicator state is delegated to `<cngx-checkbox-indicator>`
 * from `@cngx/common/display`; the interactive atom owns role,
 * keyboard, and ARIA wiring. Per Pillar 3 (Komposition statt
 * Konfiguration), the visual atom is reused — never re-drawn here.
 *
 * `aria-checked` is a reactive computed: `indeterminate() ? 'mixed' :
 * value() ? 'true' : 'false'`. The description span for
 * `disabledReason` follows the same always-in-DOM rule as
 * `CngxToggle`.
 *
 * @example
 * ```html
 * <cngx-checkbox [(value)]="acceptTerms">I accept the terms</cngx-checkbox>
 *
 * <cngx-checkbox
 *   [(value)]="allSelected()"
 *   [(indeterminate)]="someSelected() && !allSelected()"
 *   (valueChange)="toggleAll($event)"
 * >Select all</cngx-checkbox>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-checkbox, [cngxCheckbox]',
  exportAs: 'cngxCheckbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxCheckboxIndicator],
  host: {
    class: 'cngx-checkbox',
    role: 'checkbox',
    '[attr.aria-checked]': 'ariaChecked()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-describedby]': 'describedById()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[class.cngx-checkbox--checked]': 'value()',
    '[class.cngx-checkbox--indeterminate]': 'indeterminate()',
    '[class.cngx-checkbox--disabled]': 'disabled()',
    '(click)': 'handleClick()',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
  },
  providers: [{ provide: CNGX_CONTROL_VALUE, useExisting: CngxCheckbox }],
  template: `
    <cngx-checkbox-indicator
      variant="checkbox"
      [checked]="value()"
      [indeterminate]="indeterminate()"
      [disabled]="disabled()"
    />
    <span class="cngx-checkbox__label">
      <ng-content />
    </span>
    <span
      [id]="describedId"
      class="cngx-checkbox__sr-only"
      [attr.aria-hidden]="disabledReason() ? null : 'true'"
    >{{ disabledReason() }}</span>
  `,
  styleUrls: ['./checkbox.component.css'],
})
export class CngxCheckbox implements CngxControlValue<boolean> {
  readonly value = model<boolean>(false);
  readonly indeterminate = model<boolean>(false);
  readonly disabled = model<boolean>(false);
  readonly disabledReason = input<string>('');

  protected readonly describedId = nextUid('cngx-checkbox-desc');

  protected readonly describedById = computed(() =>
    this.disabledReason() ? this.describedId : null,
  );

  protected readonly ariaChecked = computed<'true' | 'false' | 'mixed'>(() =>
    this.indeterminate() ? 'mixed' : this.value() ? 'true' : 'false',
  );

  protected handleClick(): void {
    this.advance();
  }

  protected handleKeydown(event: Event): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.advance();
  }

  private advance(): void {
    if (this.disabled()) {
      return;
    }
    if (this.indeterminate()) {
      this.value.set(true);
      this.indeterminate.set(false);
      return;
    }
    this.value.update((v) => !v);
  }
}
