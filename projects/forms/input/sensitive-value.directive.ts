import { Directive, inject, output, signal, type Signal } from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from './input-config';

/**
 * Audit record emitted by {@link CngxSensitiveValue} on each reveal/hide, for
 * compliance logging (who unmasked a field and when).
 *
 * @category forms/input
 */
export interface SensitiveRevealAudit {
  /** `true` when the value was revealed, `false` when re-hidden. */
  readonly revealed: boolean;
  /** Epoch milliseconds of the toggle. */
  readonly at: number;
}

/**
 * Masks a sensitive field with reveal-on-demand and a compliance audit hook.
 *
 * Place on the `<input>`. Masked by default (`type="password"`, the browser's
 * native dot rendering), it exposes `revealed()` / `toggle()` / `show()` /
 * `hide()` for a consumer-owned reveal button, announces every reveal/hide
 * through the shared live region, and emits `audit` on each toggle
 * so compliance logging captures who unmasked the field and when.
 * The audit hook is a plain `output()`, not async
 * state.
 *
 * Masking uses the platform password rendering (a •-style dot); a custom mask
 * glyph would require reimplementing the input's edit model and is out of scope.
 *
 * ```html
 * <input cngxInput cngxSensitiveValue #sv="cngxSensitiveValue" (audit)="log($event)" />
 * <button type="button" (click)="sv.toggle()"
 *   [attr.aria-label]="sv.revealed() ? 'Hide value' : 'Reveal value'">
 *   {{ sv.revealed() ? 'Hide' : 'Reveal' }}
 * </button>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/sensitive-value.directive.ts
 * @since 0.2.0
 * @relatedTo CngxInput, CngxPasswordToggle, CngxCopyValue, withInputAriaLabels
 * <example-url>http://localhost:4200/#/forms/input/sensitive-value</example-url>
 */
@Directive({
  selector: 'input[cngxSensitiveValue]',
  standalone: true,
  exportAs: 'cngxSensitiveValue',
  host: {
    '[attr.type]': 'revealed() ? "text" : "password"',
    '[attr.autocomplete]': '"off"',
    '[attr.spellcheck]': '"false"',
  },
})
export class CngxSensitiveValue {
  private readonly config = inject(CNGX_INPUT_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);

  private readonly revealedState = signal(false);

  /** Whether the value is currently revealed (`type="text"`). Masked otherwise. */
  readonly revealed: Signal<boolean> = this.revealedState.asReadonly();

  /** Emitted on each reveal/hide for compliance logging. */
  readonly audit = output<SensitiveRevealAudit>();

  /** Toggle between masked and revealed. */
  toggle(): void {
    this.setRevealed(!this.revealedState());
  }

  /** Reveal the value. */
  show(): void {
    this.setRevealed(true);
  }

  /** Hide the value. */
  hide(): void {
    this.setRevealed(false);
  }

  private setRevealed(next: boolean): void {
    if (next === this.revealedState()) {
      return;
    }
    this.revealedState.set(next);
    this.audit.emit({ revealed: next, at: Date.now() });
    const labels = this.config.ariaLabels;
    this.announcer.announce(
      next
        ? (labels?.sensitiveReveal ?? DEFAULT_INPUT_ARIA_LABELS.sensitiveReveal)
        : (labels?.sensitiveHide ?? DEFAULT_INPUT_ARIA_LABELS.sensitiveHide),
    );
  }
}
