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
} from '@angular/core';

/**
 * Search-text highlighting via `<mark>` elements.
 *
 * Walks `TEXT_NODE` children of the host element, splits at match boundaries,
 * and wraps matched portions in `<mark>` elements. No `innerHTML` — safe by
 * construction. The `<mark>` element has correct native SR semantics (announced
 * as "highlighted" in most screen readers).
 *
 * Original DOM structure is restored when the term changes or the directive is destroyed.
 *
 * @usageNotes
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
 * @category layout
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
  /** Snapshot of original child nodes — restored before each re-highlight. */
  private originalNodes: Node[] | null = null;
  private readonly initialized = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.restore());

    afterNextRender(() => {
      this.initialized.set(true);
    });

    // DOM manipulation is a legitimate effect side effect here.
    // matchCountState is written outside the reactive graph to avoid a re-trigger loop.
    effect(() => {
      const term = this.term();
      const caseSensitive = this.caseSensitive();
      if (this.initialized()) {
        this.applyHighlight(term, caseSensitive);
      }
    });
  }

  /**
   * Performs the highlight pass: restores original DOM, then wraps matches
   * in `<mark>` elements. Updates `matchCountState` with the result count.
   */
  private applyHighlight(term: string, caseSensitive: boolean): void {
    const host = this.el.nativeElement as HTMLElement;

    if (this.originalNodes === null) {
      this.originalNodes = Array.from(host.childNodes).map((n) => n.cloneNode(true));
    } else {
      this.restoreNodes(host);
    }

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

      textNode.parentNode!.replaceChild(fragment, textNode);
    }

    this.matchCountState.set(count);
  }

  /** Restores the original DOM structure. */
  private restore(): void {
    if (this.originalNodes !== null) {
      this.restoreNodes(this.el.nativeElement as HTMLElement);
    }
  }

  private restoreNodes(host: HTMLElement): void {
    if (!this.originalNodes) {
      return;
    }
    while (host.firstChild) {
      host.removeChild(host.firstChild);
    }
    for (const node of this.originalNodes) {
      host.appendChild(node.cloneNode(true));
    }
  }

  /** Escapes special regex characters in the search term. */
  private escapeRegex(str: string): string {
    return str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  }
}
