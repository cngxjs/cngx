import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  type TemplateRef,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';

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
    '[attr.aria-checked]': 'value() ? "true" : "false"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-describedby]': 'describedById()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[class.cngx-toggle--checked]': 'value()',
    '[class.cngx-toggle--disabled]': 'disabled()',
    '[class.cngx-toggle--label-before]': 'labelPosition() === "before"',
    '(click)': 'handleClick()',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
  },
  providers: [{ provide: CNGX_CONTROL_VALUE, useExisting: CngxToggle }],
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
export class CngxToggle implements CngxControlValue<boolean> {
  readonly value = model<boolean>(false);
  readonly disabled = model<boolean>(false);
  readonly disabledReason = input<string>('');
  readonly labelPosition = input<'before' | 'after'>('after');
  readonly thumbGlyph = input<TemplateRef<void> | null>(null);

  protected readonly describedId = nextUid('cngx-toggle-desc');

  protected readonly describedById = computed(() =>
    this.disabledReason() ? this.describedId : null,
  );

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
}
