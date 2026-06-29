import { Directive, ElementRef, inject, input } from '@angular/core';

/**
 * Sanitizes pasted content before it enters the field.
 *
 * Place on the `<input>` or `<textarea>`. On `paste` it reads the clipboard
 * text, runs your `transform` (strip rich formatting, normalize separators,
 * trim), cancels the native paste, inserts the cleaned text at the caret
 * (replacing any selection), and dispatches a native `input` event so the bound
 * `[field]` / `CngxInput` sees the result through the existing DOM->signal path.
 *
 * One behaviour, one directive (Pillar 3); the synthetic `input` dispatch feeds
 * the existing one-way path, no second managed copy.
 *
 * ```html
 * <input cngxInput [cngxPasteTransform]="stripSpaces" />
 * <!-- component: stripSpaces = (s: string) => s.replace(/\s+/g, '') -->
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/paste-transform.directive.ts
 * @since 0.2.0
 * @relatedTo CngxInput, CngxTrim, CngxInputFilter
 * <example-url>http://localhost:4200/#/forms/input/paste-sanitize</example-url>
 */
@Directive({
  selector: 'input[cngxPasteTransform],textarea[cngxPasteTransform]',
  standalone: true,
  exportAs: 'cngxPasteTransform',
  host: {
    '(paste)': 'handlePaste($event)',
  },
})
export class CngxPasteTransform {
  private readonly el = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);

  /** Transform applied to the pasted text before insertion. */
  readonly transform = input.required<(pasted: string) => string>({ alias: 'cngxPasteTransform' });

  /** @internal - sanitize the clipboard text and insert it at the caret. */
  protected handlePaste(event: Event): void {
    const clipboard = (event as ClipboardEvent).clipboardData;
    if (!clipboard) {
      return;
    }
    event.preventDefault();

    const cleaned = this.transform()(clipboard.getData('text'));
    const el = this.el.nativeElement;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + cleaned + el.value.slice(end);

    const caret = start + cleaned.length;
    el.setSelectionRange(caret, caret);
    // Re-emit so the bound field/CngxInput reads the inserted value through the
    // same one-way DOM->signal path it already listens on.
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
