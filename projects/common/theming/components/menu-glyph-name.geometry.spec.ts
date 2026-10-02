/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The checked tick and
// dot are `::before` content of the item, so without CSS alt text Chromium
// folds them into the accessible name ("✓ Bold"). The name is read from the
// browser's own accessibility tree, not from computed styles.

@Component({
  selector: 'cngx-menu-glyph-name-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './cngx-menu.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ul cngxMenu role="menu">
      <li cngxMenuItemCheckbox role="menuitemcheckbox" class="cngx-menu-item--checked item-check">
        <span class="cngx-menu-item__label">Bold</span>
      </li>
      <li cngxMenuItemRadio role="menuitemradio" class="cngx-menu-item--checked item-radio">
        <span class="cngx-menu-item__label">Left</span>
      </li>
    </ul>
  `,
})
class MenuGlyphNameHost {}

interface AxNode {
  readonly name?: { readonly value?: string };
}

interface DomNode {
  readonly nodeId: number;
  readonly children?: readonly DomNode[];
  readonly contentDocument?: DomNode;
}

let mountedRoot: HTMLElement | null = null;

function mount(): void {
  const fixture = TestBed.createComponent(MenuGlyphNameHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
}

/** Every document in the tree; the spec runs inside the runner's iframe. */
function documentsOf(node: DomNode): DomNode[] {
  const nested = [
    ...(node.children ?? []),
    ...(node.contentDocument ? [node.contentDocument] : []),
  ];
  return [...(node.contentDocument ? [node.contentDocument] : []), ...nested.flatMap(documentsOf)];
}

async function accessibleName(selector: string): Promise<string | undefined> {
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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('checked menu glyphs', () => {
  it('stay visible', () => {
    mount();
    const tick = getComputedStyle(mountedRoot!.querySelector('.item-check')!, '::before');
    expect(tick.content).toContain('✓');
  });

  it('keep the tick out of a checked checkbox item name', async () => {
    mount();
    expect(await accessibleName('.item-check')).toBe('Bold');
  });

  it('keep the dot out of a checked radio item name', async () => {
    mount();
    expect(await accessibleName('.item-radio')).toBe('Left');
  });
});
