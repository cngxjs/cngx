const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/**
 * `true` for a non-blank `aria-label`, `aria-labelledby` or `title`, or non-blank text outside
 * every `[aria-hidden="true"]` and `[hidden]` subtree. Feeds the dev-mode name check.
 *
 * @internal
 */
export function hasAccessibleName(host: HTMLElement): boolean {
  const labelled = ['aria-label', 'aria-labelledby', 'title'].some(
    (attr) => (host.getAttribute(attr) ?? '').trim() !== '',
  );
  return labelled || hasNamedContent(host);
}

function hasNamedContent(node: Node): boolean {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === TEXT_NODE && (child.textContent ?? '').trim() !== '') {
      return true;
    }
    if (child.nodeType !== ELEMENT_NODE) {
      continue;
    }
    const el = child as Element;
    if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden')) {
      continue;
    }
    if (hasNamedContent(el)) {
      return true;
    }
  }
  return false;
}
