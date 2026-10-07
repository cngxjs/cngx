/// <reference types="@vitest/browser-playwright" />

import { cdp } from 'vitest/browser';

interface AxNode {
  readonly name?: { readonly value?: string };
}

interface DomNode {
  readonly nodeId: number;
  readonly children?: readonly DomNode[];
  readonly contentDocument?: DomNode;
}

/** Every document in the tree; a geometry spec runs inside the runner's iframe. */
function documentsOf(node: DomNode): DomNode[] {
  const nested = [
    ...(node.children ?? []),
    ...(node.contentDocument ? [node.contentDocument] : []),
  ];
  return [...(node.contentDocument ? [node.contentDocument] : []), ...nested.flatMap(documentsOf)];
}

/**
 * The accessible name Chromium computes for the first element matching
 * `selector`, read from the browser's own accessibility tree over CDP
 * (`Accessibility.getPartialAXTree`), not from computed styles. CSS `content`
 * of `::before` / `::after` takes part, so this is how a spec proves that a
 * glyph with alt text (`content: '✓' / ''`) stays out of the name.
 *
 * Throws when no document contains a match.
 */
export async function accessibleName(selector: string): Promise<string | undefined> {
  const session = cdp();
  const { root } = (await session.send('DOM.getDocument', { depth: -1, pierce: true })) as {
    root: DomNode;
  };
  for (const doc of [root, ...documentsOf(root)]) {
    const { nodeId } = (await session.send('DOM.querySelector', {
      nodeId: doc.nodeId,
      selector,
    })) as { nodeId: number };
    if (nodeId) {
      const { nodes } = (await session.send('Accessibility.getPartialAXTree', {
        nodeId,
        fetchRelatives: false,
      })) as { nodes: readonly AxNode[] };
      return nodes[0]?.name?.value;
    }
  }
  throw new Error(`${selector} is in no document`);
}
