import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  type TemplateRef,
} from '@angular/core';
import { CngxRovingItem } from '@cngx/common/a11y';
import { CngxRadioIndicator } from '@cngx/common/display';
import { nextUid } from '@cngx/core/utils';

import {
  CNGX_RADIO_GROUP,
  type CngxRadioGroupContract,
} from './radio-group.token';

/**
 * Single radio leaf. Injects the parent group via `CNGX_RADIO_GROUP`
 * (token, never the concrete `CngxRadioGroup` class) and writes
 * `group.value.set(this.value())` when the user picks it. The leaf
 * does not own a value of its own — `value` is a required `input<T>`
 * supplied by the consumer; checked-ness is derived from
 * `group.value() === this.value()`.
 *
 * Composes `CngxRovingItem` as a host directive with input
 * forwarding (`'cngxRovingItemDisabled: disabled'`) so the
 * consumer's `[disabled]` binding flows into both the radio's
 * own `disabled` model AND the roving directive's skip-test —
 * arrow-key navigation in the parent group (driven by
 * `CngxRovingTabindex`) skips per-radio-disabled leaves
 * automatically. Group-level `[disabled]` is a separate cascade
 * via `radioDisabled = computed(() => group.disabled() ||
 * disabled())`; it blocks click + Space/Enter + auto-select
 * (`consumePendingArrowSelect` returns false when the group is
 * disabled) but is NOT forwarded to roving — a fully-disabled
 * group lets focus transit visually while every selection
 * pathway short-circuits.
 *
 * Selection on click, Space, or Enter (auto-select also fires
 * on arrow nav via `consumePendingArrowSelect`); Tab and
 * programmatic focus do not select on focus alone (W3C APG
 * variant — the parent group's keyboard contract makes this
 * explicit).
 *
 * The `[attr.name]` host binding is **cosmetic** (parity with
 * native `<input type="radio" name="…">` markup expectations);
 * the `<div role="radio">` host does not participate in HTML
 * form submission, so the attribute carries no functional
 * weight.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-radio, [cngxRadio]',
  exportAs: 'cngxRadio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingItem,
      inputs: ['cngxRovingItemDisabled: disabled'],
    },
  ],
  imports: [CngxRadioIndicator],
  host: {
    class: 'cngx-radio',
    role: 'radio',
    '[attr.aria-checked]': 'radioChecked() ? "true" : "false"',
    '[attr.aria-disabled]': 'radioDisabled() ? "true" : null',
    '[attr.aria-describedby]': 'describedById()',
    '[attr.name]': 'group.name()',
    '[class.cngx-radio--checked]': 'radioChecked()',
    '[class.cngx-radio--disabled]': 'radioDisabled()',
    '(focus)': 'handleFocus()',
    '(click)': 'handleSelect()',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
  },
  template: `
    <cngx-radio-indicator
      [checked]="radioChecked()"
      [disabled]="radioDisabled()"
      [dotGlyph]="dotGlyph()"
    />
    <span class="cngx-radio__label">
      <ng-content />
    </span>
    <span
      [id]="describedId"
      class="cngx-radio__sr-only"
      [attr.aria-hidden]="disabledReason() ? null : 'true'"
    >{{ disabledReason() }}</span>
  `,
  styleUrls: ['./radio.component.css'],
})
export class CngxRadio<T = unknown> {
  protected readonly group = inject<CngxRadioGroupContract<T>>(CNGX_RADIO_GROUP);

  readonly value = input.required<T>();
  readonly disabled = model<boolean>(false);
  readonly disabledReason = input<string>('');
  readonly dotGlyph = input<TemplateRef<void> | null>(null);

  private readonly id = nextUid('cngx-radio');
  protected readonly describedId = nextUid('cngx-radio-desc');

  protected readonly radioChecked = computed(
    () => this.group.value() === this.value(),
  );

  protected readonly radioDisabled = computed(
    () => this.group.disabled() || this.disabled(),
  );

  protected readonly describedById = computed(() =>
    this.disabledReason() ? this.describedId : null,
  );

  constructor() {
    this.group.register({
      id: this.id,
      value: () => this.value(),
      disabled: () => this.radioDisabled(),
    });
    inject(DestroyRef).onDestroy(() => this.group.unregister(this.id));
  }

  protected handleFocus(): void {
    if (this.radioDisabled()) {
      return;
    }
    this.group.consumePendingArrowSelect(this.value());
  }

  protected handleSelect(): void {
    if (this.radioDisabled()) {
      return;
    }
    this.group.value.set(this.value());
  }

  protected handleKeydown(event: Event): void {
    if (this.radioDisabled()) {
      return;
    }
    event.preventDefault();
    this.group.value.set(this.value());
  }
}
