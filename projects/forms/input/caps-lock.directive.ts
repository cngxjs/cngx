import { Directive, inject, signal, type Signal } from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from './input-config';

/**
 * Caps-lock warning for password and other case-sensitive fields.
 *
 * Place on the `<input>`. Reads `KeyboardEvent.getModifierState('CapsLock')`
 * on every keystroke, drives a `capsOn` signal, and announces the warning
 * exactly once on the off->on edge through the shared `CngxLiveAnnouncer`
 * (assertive, so a screen-reader user hears it while typing). Detection needs
 * a key event - the modifier state is unreadable from a `FocusEvent`, so the
 * warning surfaces on the first keystroke after focus and clears on blur.
 *
 * The directive owns the screen-reader channel; the visible warning is
 * consumer-rendered from `capsOn` so the skin stays the consumer's. The
 * announced string flows through the `CNGX_INPUT_CONFIG.ariaLabels.capsLockOn`
 * cascade and is English by default.
 *
 * ```html
 * <input cngxInput cngxCapsLock #caps="cngxCapsLock" type="password" />
 * @if (caps.capsOn()) {
 *   <span class="hint">Caps Lock is on</span>
 * }
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/caps-lock.directive.ts
 * @since 0.2.0
 * @relatedTo CngxInput, CngxPasswordToggle, CngxPasswordStrength, withInputAriaLabels
 */
@Directive({
  selector: 'input[cngxCapsLock]',
  standalone: true,
  exportAs: 'cngxCapsLock',
  host: {
    '(keydown)': 'sync($event)',
    '(keyup)': 'sync($event)',
    '(focus)': 'sync($event)',
    '(blur)': 'reset()',
  },
})
export class CngxCapsLock {
  private readonly config = inject(CNGX_INPUT_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);

  private readonly capsOnState = signal(false);

  /** Whether Caps Lock is currently detected as active. */
  readonly capsOn: Signal<boolean> = this.capsOnState.asReadonly();

  /** @internal - reads the live CapsLock modifier; announces only on the off->on edge. */
  protected sync(event: KeyboardEvent | FocusEvent): void {
    if (typeof (event as KeyboardEvent).getModifierState !== 'function') {
      // FocusEvent and other non-keyboard events carry no modifier state;
      // wait for the first key event to read CapsLock.
      return;
    }
    const active = (event as KeyboardEvent).getModifierState('CapsLock');
    const was = this.capsOnState();
    this.capsOnState.set(active);
    if (active && !was) {
      this.announcer.announce(
        this.config.ariaLabels?.capsLockOn ?? DEFAULT_INPUT_ARIA_LABELS.capsLockOn,
        'assertive',
      );
    }
  }

  /** @internal - clears the warning on blur; CapsLock state is unobservable while unfocused. */
  protected reset(): void {
    this.capsOnState.set(false);
  }
}
