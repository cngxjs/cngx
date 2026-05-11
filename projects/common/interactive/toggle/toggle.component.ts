import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
  type TemplateRef,
} from '@angular/core';
import {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldControl,
} from '@cngx/core/tokens';
import { nextUid } from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';
import { CNGX_ERROR_AGGREGATOR } from '../error-aggregator/error-aggregator.token';

/**
 * Single-value boolean switch with W3C `role="switch"` semantics. Click,
 * Space, and Enter all flip `value`; the directive form (`[cngxToggle]`)
 * applies the contract to a host element that owns its own markup, while
 * the element form (`<cngx-toggle>`) renders a track + thumb skin and
 * accepts label content via `<ng-content>`.
 *
 * `value` is a `ModelSignal<boolean>` — consumers two-way-bind via
 * `[(value)]` and the directive emits `valueChange` on every flip.
 * `disabled` is also a `ModelSignal<boolean>` so the
 * `CngxFormBridge` (Phase 7) can drive it via `setDisabledState`
 * without a separate write path; consumers usually only read or set
 * one direction.
 *
 * `disabledReason` is consumer-supplied free text (no library default
 * per `feedback_en_default_locale`) — when present it lands in a hidden
 * `<span>` referenced by the host's `aria-describedby`. Per Pillar 2,
 * the description span is always in the DOM (visibility toggles via
 * `aria-hidden`); the host's `aria-describedby` is only emitted when a
 * reason is set so AT does not announce an empty description.
 *
 * Typical usage prefers the `<div>`/`<cngx-toggle>` element form because
 * `role="switch"` on a native `<button>` would conflict with the
 * browser's own Space → click synthesis and produce double-toggles.
 *
 * @example
 * ```html
 * <cngx-toggle [(value)]="emailNotifications">
 *   E-mails empfangen
 * </cngx-toggle>
 *
 * <div
 *   cngxToggle
 *   [(value)]="dark"
 *   [disabled]="systemPreferenceLocked()"
 *   disabledReason="Locked by your OS preference"
 * >Dark mode</div>
 * ```
 *
 * @example
 * ```html
 * <ng-template #icon><span aria-hidden="true">★</span></ng-template>
 * <cngx-toggle [(value)]="featured" [thumbGlyph]="icon">Featured</cngx-toggle>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: '[cngxToggle], cngx-toggle',
  exportAs: 'cngxToggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cngx-toggle',
    role: 'switch',
    '[attr.id]': 'id()',
    '[attr.aria-checked]': 'value() ? "true" : "false"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': 'errorMessageId()',
    '[attr.aria-describedby]': 'describedById()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[class.cngx-toggle--checked]': 'value()',
    '[class.cngx-toggle--disabled]': 'disabled()',
    '[class.cngx-toggle--label-before]': 'labelPosition() === "before"',
    '(click)': 'handleClick()',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxToggle },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxToggle },
  ],
  imports: [NgTemplateOutlet],
  template: `
    <span class="cngx-toggle__track" aria-hidden="true">
      <span class="cngx-toggle__thumb">
        @if (thumbGlyph(); as glyph) {
          <ng-container *ngTemplateOutlet="glyph" />
        }
      </span>
    </span>
    <span class="cngx-toggle__label">
      <ng-content />
    </span>
    <span
      [id]="describedId"
      class="cngx-toggle__sr-only"
      [attr.aria-hidden]="disabledReason() ? null : 'true'"
    >{{ disabledReason() }}</span>
  `,
  styleUrls: ['./toggle.component.css'],
})
export class CngxToggle
  implements CngxControlValue<boolean>, CngxFormFieldControl
{
  readonly value = model<boolean>(false);
  readonly disabled = model<boolean>(false);
  /**
   * Bridge-writable invalid state. `model<boolean>` mirrors `disabled`
   * so external integrations (RF/Signal-Forms bridges, custom validity
   * adapters) can drive it without a parallel API path — consumers
   * typically read only.
   */
  readonly invalid = model<boolean>(false);
  /**
   * Optional id of an external error message element (e.g. a sibling
   * rendered by `<cngx-form-field>` or a consumer-owned `<span>`).
   * When set, the host emits `aria-errormessage="<id>"` so AT can
   * locate the message; consumers MUST render an element with that id
   * — passing an id without a matching element produces a dangling
   * AT reference. Default `null` skips the attribute entirely.
   * Note: WAI-ARIA dictates that AT ignores this attribute when
   * `aria-invalid` is absent or `"false"`, so a stable always-emitted
   * id is harmless when the field is valid.
   */
  readonly errorMessageId = input<string | null>(null);
  readonly disabledReason = input<string>('');
  readonly labelPosition = input<'before' | 'after'>('after');
  readonly thumbGlyph = input<TemplateRef<void> | null>(null);

  protected readonly describedId = nextUid('cngx-toggle-desc');

  protected readonly describedById = computed(() =>
    this.disabledReason() ? this.describedId : null,
  );

  // ── CngxFormFieldControl ─────────────────────────────────────────

  /** Stable per-instance id used for `<label for>` wiring. */
  readonly id = signal(nextUid('cngx-toggle-')).asReadonly();

  private readonly focusedState = signal(false);
  /** Whether the host element currently has DOM focus. */
  readonly focused = this.focusedState.asReadonly();

  /** True when the toggle is `false` (off) — boolean atom semantics. */
  readonly empty = computed(() => this.value() === false);

  private readonly fieldHost = inject(CNGX_FORM_FIELD_HOST, { optional: true });
  private readonly aggregator = inject(CNGX_ERROR_AGGREGATOR, {
    optional: true,
    skipSelf: true,
  });

  /**
   * Field-host→aggregator cascade. Inside `<cngx-form-field>` the
   * presenter governs visibility (touched / strategy / scope). Outside
   * form-field but inside `<cngxErrorAggregator>` the aggregator's
   * `shouldShow` (reveal-aware) wins. Outside both contexts the atom
   * paints no error skin.
   */
  readonly errorState = computed<boolean>(
    () =>
      this.fieldHost?.showError() ?? this.aggregator?.shouldShow() ?? false,
  );

  // ── Event handlers ───────────────────────────────────────────────

  protected handleClick(): void {
    if (this.disabled()) {
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

  protected handleFocusIn(): void {
    this.focusedState.set(true);
  }

  protected handleFocusOut(): void {
    this.focusedState.set(false);
    this.fieldHost?.markAsTouched();
  }
}
