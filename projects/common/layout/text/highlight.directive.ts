import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

/**
 * Search-text highlighting via `<mark>` elements.
 *
 * Walks `TEXT_NODE` children of the host element, splits at match boundaries,
 * and wraps matched portions in `<mark>` elements. No `innerHTML` - safe by
 * construction. The `<mark>` element has correct native SR semantics (announced
 * as "highlighted" in most screen readers).
 *
 * The original text nodes are kept by reference and re-inserted when the
 * term changes or the directive is destroyed - Angular bindings targeting
 * them (interpolations, structural directives) stay live.
 *
 * ### Search result highlighting
 * ```html
 * <p [cngxHighlight]="searchTerm()">
 *   Angular Signals represent a fundamental shift in reactivity.
 * </p>
 * ```
 *
 * ### Case-sensitive matching
 * ```html
 * <p [cngxHighlight]="term()" [highlightCaseSensitive]="true">
 *   CamelCase matters here.
 * </p>
 * ```
 *
 * @category common/layout
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/text/highlight.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTruncate, CngxExpandableText
 * <example-url>http://localhost:4200/#/common/layout/highlight/live-search-highlighting</example-url>
 * <example-url>http://localhost:4200/#/common/layout/highlight/multiple-paragraphs</example-url>
 */
@Directive({
  selector: '[cngxHighlight]',
  exportAs: 'cngxHighlight',
  standalone: true,
})
export class CngxHighlight {
  /** The search term to highlight. Empty string clears all highlights. */
  readonly term = input<string>('', { alias: 'cngxHighlight' });
  /** Whether matching is case-sensitive. */
  readonly caseSensitive = input<boolean>(false, { alias: 'highlightCaseSensitive' });

  private readonly matchCountState = signal(0);
  /** Number of matches found in the current highlight pass. */
  readonly matchCount = this.matchCountState.asReadonly();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  /**
   * The text nodes replaced by the current highlight pass, by reference,
   * with the nodes standing in for them. Undone before every re-highlight
   * and on destroy - re-inserting the original references keeps LView
   * bindings (interpolations) attached to live DOM.
   */
  private replacements: { original: Text; inserted: Node[] }[] = [];
  private readonly initialized = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.restoreNodes());

    afterNextRender(() => {
      this.initialized.set(true);
    });

    // The highlight pass writes matchCountState - untracked, so the write
    // cannot re-trigger this effect.
    effect(() => {
      const term = this.term();
      const caseSensitive = this.caseSensitive();
      if (this.initialized()) {
        untracked(() => this.applyHighlight(term, caseSensitive));
      }
    });
  }

  /**
   * Performs the highlight pass: restores original DOM, then wraps matches
   * in `<mark>` elements. Updates `matchCountState` with the result count.
   */
  private applyHighlight(term: string, caseSensitive: boolean): void {
    const host = this.el.nativeElement as HTMLElement;

    this.restoreNodes();

    if (!term) {
      this.matchCountState.set(0);
      return;
    }

    let count = 0;
    const walker = this.doc.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    // Collect nodes before modifying the DOM during the walk.
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent ?? '';
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(this.escapeRegex(term), flags);
      const matches = [...text.matchAll(regex)];

      if (matches.length === 0) {
        continue;
      }

      count += matches.length;
      const fragment = this.doc.createDocumentFragment();
      let lastIndex = 0;

      for (const match of matches) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;

        if (matchStart > lastIndex) {
          fragment.appendChild(this.doc.createTextNode(text.slice(lastIndex, matchStart)));
        }

        const mark = this.doc.createElement('mark');
        mark.textContent = text.slice(matchStart, matchEnd);
        fragment.appendChild(mark);

        lastIndex = matchEnd;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(this.doc.createTextNode(text.slice(lastIndex)));
      }

      // Capture before replaceChild - inserting a fragment empties it.
      const inserted = Array.from(fragment.childNodes);
      textNode.parentNode!.replaceChild(fragment, textNode);
      this.replacements.push({ original: textNode, inserted });
    }

    this.matchCountState.set(count);
  }

  /** Puts the original text nodes back and removes the highlight nodes. */
  private restoreNodes(): void {
    for (const { original, inserted } of this.replacements) {
      const parent = inserted[0]?.parentNode;
      if (!parent) {
        continue;
      }
      parent.insertBefore(original, inserted[0]);
      for (const node of inserted) {
        if (node.parentNode === parent) {
          parent.removeChild(node);
        }
      }
    }
    this.replacements = [];
  }

  /** Escapes special regex characters in the search term. */
  private escapeRegex(str: string): string {
    return str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  }
}
