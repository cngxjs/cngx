import { booleanAttribute, Directive, ElementRef, inject, input } from '@angular/core';

/**
 * Normalizes whitespace and Unicode form on blur.
 *
 * Place on the `<input>` or `<textarea>`. On `blur` it Unicode-NFC-normalizes
 * the value, optionally collapses internal whitespace runs to a single space
 * (`cngxTrimCollapse`), and trims the ends. When the value changes it writes
 * back and dispatches a native `input` event, so a bound `[field]` / `CngxInput`
 * sees the normalized value through the existing DOM->signal path - this is a
 * deliberate imperative DOM normalizer, not a second managed copy.
 *
 * Kept separate from `CngxInputFormat` so a format/parse atom is not overloaded
 * with normalization (Pillar 3).
 *
 * ```html
 * <input cngxInput cngxTrim [field]="f.name" />
 * <textarea cngxTrim cngxTrimCollapse [field]="f.bio"></textarea>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/trim.directive.ts
 * @since 0.2.0
 * @relatedTo CngxInput, CngxInputFilter, CngxInputFormat
 * <example-url>http://localhost:4200/#/forms/input/trim-on-blur</example-url>
 */
@Directive({
  selector: 'input[cngxTrim],textarea[cngxTrim]',
  standalone: true,
  exportAs: 'cngxTrim',
  host: {
    '(blur)': 'handleBlur()',
  },
})
export class CngxTrim {
  private readonly el = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);

  /** Collapse internal whitespace runs to a single space. Opt-in. */
  readonly collapse = input(false, { alias: 'cngxTrimCollapse', transform: booleanAttribute });

  /** @internal - normalize the DOM value on blur and re-emit `input` if it changed. */
  protected handleBlur(): void {
    const el = this.el.nativeElement;
    const current = el.value;
    let next = current.normalize('NFC');
    if (this.collapse()) {
      next = next.replace(/\s+/g, ' ');
    }
    next = next.trim();
    if (next !== current) {
      el.value = next;
      // Re-emit so the bound field/CngxInput reads the normalized value through
      // the same one-way DOM->signal path it already listens on.
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
