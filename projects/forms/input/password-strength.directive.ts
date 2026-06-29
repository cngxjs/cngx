import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  type Signal,
} from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from './input-config';
import {
  CNGX_PASSWORD_STRENGTH_FACTORY,
  type PasswordStrengthLabel,
  type PasswordStrengthResult,
} from './password-strength.factory';

const strengthEqual = (a: PasswordStrengthResult, b: PasswordStrengthResult): boolean =>
  a.score === b.score && a.label === b.label;

/** Default debounce before the strength label is announced, in ms. */
const ANNOUNCE_DEBOUNCE_MS = 400;

/**
 * Live password-strength feedback for a password field.
 *
 * Place on the `<input>`. Reads the value on every `(input)`, derives a
 * {@link PasswordStrengthResult} through the swappable
 * {@link CNGX_PASSWORD_STRENGTH_FACTORY}, and exposes `score()` (0..4),
 * `label()` and the whole `strength()` result as signals - render your own
 * meter or pair it with `<cngx-password-strength-meter [score]>`. The label is
 * announced politely and debounced so a screen reader is not spammed
 * mid-keystroke, while `score()`/`label()` stay live for the visual.
 *
 * The announced string flows through the
 * `CNGX_INPUT_CONFIG.ariaLabels.passwordStrength` template (English by default,
 * consumer-overridable). The empty field is not announced.
 *
 * ```html
 * <input cngxInput cngxPasswordStrength #pw="cngxPasswordStrength" type="password" />
 * <cngx-password-strength-meter [score]="pw.score()" />
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/password-strength.directive.ts
 * @since 0.2.0
 * @relatedTo CngxInput, CngxPasswordToggle, CngxCapsLock, CngxPasswordStrengthMeter, CNGX_PASSWORD_STRENGTH_FACTORY, withInputAriaLabels
 */
@Directive({
  selector: 'input[cngxPasswordStrength]',
  standalone: true,
  exportAs: 'cngxPasswordStrength',
  host: {
    '(input)': 'sync()',
  },
})
export class CngxPasswordStrength {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly config = inject(CNGX_INPUT_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);
  private readonly estimate = inject(CNGX_PASSWORD_STRENGTH_FACTORY);
  private readonly destroyRef = inject(DestroyRef);

  private readonly valueState = signal('');

  /** The full strength result; recomputes only when score or label changes. */
  readonly strength: Signal<PasswordStrengthResult> = computed(
    () => this.estimate(this.valueState()),
    { equal: strengthEqual },
  );

  /** Discrete strength score, 0..4. Drives the meter. */
  readonly score: Signal<number> = computed(() => this.strength().score);

  /** Coarse strength label (`weak`/`fair`/`good`/`strong`). */
  readonly label: Signal<PasswordStrengthLabel> = computed(() => this.strength().label);

  constructor() {
    let timer: ReturnType<typeof setTimeout> | null = null;

    effect(() => {
      const label = this.label();
      const hasValue = this.valueState().length > 0;
      untracked(() => {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        if (!hasValue) {
          // Never announce the empty field; only debounce real strength changes.
          return;
        }
        timer = setTimeout(() => {
          const template =
            this.config.ariaLabels?.passwordStrength ??
            DEFAULT_INPUT_ARIA_LABELS.passwordStrength;
          this.announcer.announce(template(label));
          timer = null;
        }, ANNOUNCE_DEBOUNCE_MS);
      });
    });

    this.destroyRef.onDestroy(() => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    });
  }

  /** @internal - mirror the DOM value into the strength source signal. */
  protected sync(): void {
    this.valueState.set(this.el.nativeElement.value);
  }
}
