/**
 * The text a screen reader would speak for the content of `el`: every text
 * node joined, subtrees marked `aria-hidden="true"` or `hidden` skipped,
 * whitespace collapsed and trimmed. `el` itself is read even when it carries
 * one of those markers, so a caller can read a cell it is about to reveal.
 *
 * Element boundaries count as word breaks, block and inline elements alike:
 * `<strong>Error:</strong><span>Denied</span>` reads `Error: Denied` even
 * after the template compiler has dropped the whitespace between the tags.
 *
 * Built for live-region copy that must match what is shown: a status cell
 * with a decorative icon (`aria-hidden`) and a message speaks the message
 * only. It does not compute a full accessible name (no `aria-label`, no
 * `alt`, no CSS `content`); use it on plain rendered text.
 *
 * @param el The element whose descendant text is read.
 * @returns The collapsed, trimmed text; `''` when nothing is readable.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/spoken-text.ts
 * @since 0.1.0
 */
export function resolveSpokenText(el: Element): string {
  const parts: string[] = [];
  collectText(el, parts);
  return parts.join('').replace(/\s+/g, ' ').trim();
}

function collectText(node: Node, parts: string[]): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) {
      parts.push(child.nodeValue ?? '');
      continue;
    }
    if (child.nodeType !== 1) {
      continue;
    }
    const element = child as Element;
    if (element.getAttribute('aria-hidden') === 'true' || element.hasAttribute('hidden')) {
      continue;
    }
    parts.push(' ');
    collectText(element, parts);
    parts.push(' ');
  }
}
