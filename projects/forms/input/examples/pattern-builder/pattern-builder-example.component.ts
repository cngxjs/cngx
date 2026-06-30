import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CngxInputMask } from '@cngx/forms/input';

/**
 * Build your own mask pattern live.
 *
 * Type a pattern into the top field and the masked input below re-targets to
 * it through `[cngxInputMask]="pattern()"`. Tokens: `0` digit, `A` letter,
 * `*` alphanumeric, `9` optional digit, `a` optional letter; any other
 * character is a literal, and `\\` escapes a token char into a literal.
 * Changing the pattern clears the entered value - that is the directive's
 * documented auto-clear on a mask-string change.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxInputMask],
  template: `
    <div style="display:grid;gap:0.85rem;max-width:30rem">
      <label style="display:grid;gap:0.25rem">
        <span style="font-size:0.8125rem;font-weight:600">Mask pattern</span>
        <input
          [value]="pattern()"
          (input)="pattern.set(asValue($event))"
          spellcheck="false"
          style="font:inherit;padding:0.4rem 0.55rem;border:1px solid #cbd5e1;border-radius:0.375rem"
        />
      </label>

      <label style="display:grid;gap:0.25rem">
        <span style="font-size:0.8125rem;font-weight:600">Your masked input</span>
        <input
          [cngxInputMask]="pattern()"
          #m="cngxInputMask"
          style="font:inherit;padding:0.4rem 0.55rem;border:1px solid #cbd5e1;border-radius:0.375rem"
        />
      </label>

      <small style="opacity:0.7">Display: {{ m.maskedValue() }} &middot; raw: {{ m.value() || '(empty)' }}</small>

      <fieldset style="border:1px solid #e2e8f0;border-radius:0.5rem;padding:0.6rem 0.75rem;display:grid;gap:0.4rem">
        <legend style="font-size:0.8125rem;font-weight:600;padding:0 0.3rem">Tokens</legend>
        @for (t of tokens; track t.token) {
          <div style="display:flex;gap:0.5rem;font-size:0.8125rem">
            <code style="min-width:1.5rem">{{ t.token }}</code>
            <span style="opacity:0.75">{{ t.meaning }}</span>
            <button
              type="button"
              (click)="append(t.token)"
              style="margin-left:auto;font:inherit;font-size:0.75rem;padding:0.1rem 0.45rem;border:1px solid #cbd5e1;border-radius:0.3rem;background:#f8fafc;cursor:pointer"
            >
              add
            </button>
          </div>
        }
      </fieldset>

      <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
        @for (p of presets; track p) {
          <button
            type="button"
            (click)="pattern.set(p)"
            style="font:inherit;font-size:0.75rem;padding:0.2rem 0.55rem;border:1px solid #cbd5e1;border-radius:0.3rem;background:#f8fafc;cursor:pointer"
          >
            {{ p }}
          </button>
        }
      </div>
    </div>
  `,
})
export class PatternBuilderExample {
  protected readonly pattern = signal('(000) 000-0000');

  protected readonly tokens: ReadonlyArray<{ token: string; meaning: string }> = [
    { token: '0', meaning: 'required digit' },
    { token: 'A', meaning: 'required letter' },
    { token: '*', meaning: 'letter or digit' },
    { token: '9', meaning: 'optional digit' },
    { token: 'a', meaning: 'optional letter' },
  ];

  protected readonly presets: readonly string[] = [
    '(000) 000-0000',
    '0000 0000 0000 0000',
    'AA-00-AA',
    '00:00',
  ];

  protected asValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected append(token: string): void {
    this.pattern.update((p) => p + token);
  }
}
