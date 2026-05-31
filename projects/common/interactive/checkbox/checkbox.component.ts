import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  signal,
  type TemplateRef,
} from '@angular/core';
import { CngxRovingItem, CngxRovingTabindex } from '@cngx/common/a11y';
import { CngxCheckboxIndicator } from '@cngx/common/display';
import {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldControl,
} from '@cngx/core/tokens';
import { nextUid } from '@cngx/core/utils';

import { CNGX_CONTROL_VALUE, type CngxControlValue } from '../control-value/control-value.token';
import { CNGX_ERROR_AGGREGATOR } from '../error-aggregator/error-aggregator.token';

/**
 * Single-value boolean checkbox with indeterminate support and W3C
 * `role="checkbox"` semantics. Click, Space, and Enter all advance
 * `value`; an indeterminate checkbox advances to `value=true`,
 * `indeterminate=false` in a single step (per WAI-ARIA tristate
 * semantics - there is no path that lands the checkbox back in
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
 * from `@cngx/common/display`; this interactive molecule owns role,
 * keyboard, and ARIA wiring and composes the display atom. Per
 * Pillar 3, the visual atom is
 * reused - never re-drawn here.
 *
 * `aria-checked` is a reactive computed: `indeterminate() ? 'mixed' :
 * value() ? 'true' : 'false'`. The description span for
 * `disabledReason` follows the same always-in-DOM rule as
 * `CngxToggle`.
 *
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
 * @category common/interactive
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/checkbox/checkbox.component.ts
 * @selector cngx-checkbox
 * @since 0.1.0
 * @relatedTo CngxCheckboxGroup, CngxCheckboxIndicator, CngxToggle, CngxRadio
 * <example-url>http://localhost:4200/#/common/interactive/checkbox/group/basic-select-all-master-projected-leaves</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/checkbox/group/disabled-cascade</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/checkbox/base/basic-two-way-binding</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/checkbox/base/custom-check-dash-glyphs</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/checkbox/base/disabled</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/checkbox/base/tri-state-select-all-pattern</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-primitives/coming-in-a-follow-up</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-primitives/reactive-forms-same-atom-just-bind-formcontrol</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-primitives/signal-forms-drop-the-atom-into-cngx-form-field</example-url>
 */
@Component({
  selector: 'cngx-checkbox, [cngxCheckbox]',
  exportAs: 'cngxCheckbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingItem,
      inputs: ['cngxRovingItemDisabled: disabled'],
    },
  ],
  imports: [CngxCheckboxIndicator],
  host: {
    class: 'cngx-checkbox',
    role: 'checkbox',
    '[attr.id]': 'id()',
    '[attr.aria-checked]': 'ariaChecked()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': '(invalid() || errorState()) ? errorMessageId() : null',
    '[attr.aria-describedby]': 'describedId',
    '[attr.tabindex]': 'hostTabindex()',
    '[class.cngx-checkbox--checked]': 'value()',
    '[class.cngx-checkbox--indeterminate]': 'indeterminate()',
    '[class.cngx-checkbox--disabled]': 'disabled()',
    '(click)': 'handleClick()',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxCheckbox },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxCheckbox },
  ],
  template: `
    <cngx-checkbox-indicator
      variant="checkbox"
      [checked]="value()"
      [indeterminate]="indeterminate()"
      [disabled]="disabled()"
      [checkGlyph]="checkGlyph()"
      [dashGlyph]="dashGlyph()"
    />
    <span class="cngx-checkbox__label">
      <ng-content />
    </span>
    <span
      [id]="describedId"
      class="cngx-checkbox__sr-only"
      [attr.aria-hidden]="disabledReason() ? null : 'true'"
      >{{ disabledReason() }}</span
    >
  `,
  styleUrls: ['./checkbox.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxCheckbox implements CngxControlValue<boolean>, CngxFormFieldControl {
  readonly value = model<boolean>(false);
  readonly indeterminate = model<boolean>(false);
  readonly disabled = model<boolean>(false);
  /**
   * Bridge-writable invalid state. `model<boolean>` mirrors `disabled`
   * so external integrations (RF/Signal-Forms bridges, custom validity
   * adapters) can drive it without a parallel API path - consumers
   * typically read only.
   */
  readonly invalid = model<boolean>(false);
  /**
   * Optional id of an external error message element (e.g. a sibling
   * rendered by `<cngx-form-field>` or a consumer-owned `<span>`).
   * The host emits `aria-errormessage="<id>"` only when
   * `aria-invalid="true"` — symmetric with the sibling `aria-invalid`
   * host binding (both gate on `invalid() || errorState()`). Consumers
   * MUST render an element with the supplied id; passing an id without
   * a matching element produces a dangling AT reference. Default
   * `null` skips the attribute entirely.
   */
  readonly errorMessageId = input<string | null>(null);
  readonly disabledReason = input<string>('');
  readonly checkGlyph = input<TemplateRef<void> | null>(null);
  readonly dashGlyph = input<TemplateRef<void> | null>(null);

  protected readonly describedId = nextUid('cngx-checkbox-desc');

  private readonly rovingParent = inject(CngxRovingTabindex, {
    optional: true,
    skipSelf: true,
  });

  /**
   * When inside a `CngxRovingTabindex` parent (typically `CngxCheckboxGroup`),
   * yields `null` so the roving controller owns the `tabindex` attribute
   * uncontested. Standalone, falls back to the WAI-ARIA default of
   * `0` (or `-1` when disabled). Mirrors `CngxCard.hostTabindex`.
   */
  protected readonly hostTabindex = computed<number | null>(() =>
    this.rovingParent ? null : this.disabled() ? -1 : 0,
  );

  protected readonly ariaChecked = computed<'true' | 'false' | 'mixed'>(() =>
    this.indeterminate() ? 'mixed' : this.value() ? 'true' : 'false',
  );

  readonly id = signal(nextUid('cngx-checkbox-')).asReadonly();

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /**
   * Empty when value is `false` AND not in tri-state intermediate. An
   * indeterminate checkbox carries user-visible state, so it does not
   * count as empty for forms purposes.
   */
  readonly empty = computed(() => this.value() === false && !this.indeterminate());

  private readonly fieldHost = inject(CNGX_FORM_FIELD_HOST, { optional: true });
  private readonly aggregator = inject(CNGX_ERROR_AGGREGATOR, {
    optional: true,
    skipSelf: true,
  });

  readonly errorState = computed<boolean>(
    () => this.fieldHost?.showError() ?? this.aggregator?.shouldShow() ?? false,
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

  protected handleFocusIn(): void {
    this.focusedState.set(true);
  }

  protected handleFocusOut(): void {
    this.focusedState.set(false);
    this.fieldHost?.markAsTouched();
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
