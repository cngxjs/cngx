import { computed, Directive, inject, input, type Signal } from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from './input-config';

/**
 * Allowed-character pattern for {@link CngxInputFilter}. The three string
 * presets cover the common cases; a `RegExp` must match a single allowed
 * character (it is tested per code point, not against the whole string).
 *
 * @category forms/input
 */
export type InputFilterPattern = 'digits' | 'alpha' | 'alphanumeric' | RegExp;

function charMatcher(pattern: InputFilterPattern): (char: string) => boolean {
  if (pattern === 'digits') {
    return (c) => c >= '0' && c <= '9';
  }
  if (pattern === 'alpha') {
    return (c) => /[a-z]/i.test(c);
  }
  if (pattern === 'alphanumeric') {
    return (c) => /[a-z0-9]/i.test(c);
  }
  return (c) => {
    pattern.lastIndex = 0;
    return pattern.test(c);
  };
}

/**
 * Restricts freeform input to a character class without a full mask.
 *
 * Place on the `<input>`. Cancels any `beforeinput` insertion (typing, paste,
 * IME commit) that contains a disallowed character and announces the rejection
 * assertively through the shared live region - a rejected keystroke is a state
 * change, never a silent drop (Pillar 2). Deletions and navigation are never
 * touched. For full positional formatting use `CngxInputMask`; this is the
 * lighter "digits only" tool (Pillar 3).
 *
 * ```html
 * <input cngxInput cngxInputFilter="digits" inputmode="numeric" />
 * <input cngxInput [cngxInputFilter]="/[A-Za-z-]/" />
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/input-filter.directive.ts
 * @since 0.2.0
 * @relatedTo CngxInput, CngxInputMask, CngxTrim, withInputAriaLabels
 * <example-url>http://localhost:4200/#/forms/input/charset-filter</example-url>
 */
@Directive({
  selector: 'input[cngxInputFilter],textarea[cngxInputFilter]',
  standalone: true,
  exportAs: 'cngxInputFilter',
  host: {
    '(beforeinput)': 'handleBeforeInput($event)',
  },
})
export class CngxInputFilter {
  private readonly config = inject(CNGX_INPUT_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);

  /** The allowed-character pattern: a preset name or a single-char `RegExp`. */
  readonly pattern = input.required<InputFilterPattern>({ alias: 'cngxInputFilter' });

  private readonly matcher: Signal<(char: string) => boolean> = computed(() =>
    charMatcher(this.pattern()),
  );

  /** @internal - cancel a disallowed insertion and announce the rejection. */
  protected handleBeforeInput(event: Event): void {
    const data = (event as InputEvent).data;
    if (data == null || data === '') {
      // Deletions, navigation, and non-text insertions carry no `data`.
      return;
    }
    const matcher = this.matcher();
    for (const char of data) {
      if (!matcher(char)) {
        event.preventDefault();
        this.announcer.announce(
          this.config.ariaLabels?.inputRejected ?? DEFAULT_INPUT_ARIA_LABELS.inputRejected,
          'assertive',
        );
        return;
      }
    }
  }
}
