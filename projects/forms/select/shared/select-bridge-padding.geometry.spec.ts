import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// select bridge (`./select-bridge-padding.spec-host.scss`). Material 3 menus
// sit their rows edge-to-edge: the bridge zeroes the panel and tree insets and
// gives a tree row the 16px end padding of an option row. The component
// stylesheets SET the same tokens from the scale on those elements, so the
// bridge values must carry element specificity to land.

// Static markup in the composites' host elements: the panel and the tree
// render inside the select host, whose element the bridge keys on.
const TEMPLATE = `
  <cngx-select>
    <div class="cngx-select__panel panel">
      <div class="cngx-select__option">Red</div>
    </div>
  </cngx-select>
  <cngx-tree-select>
    <cngx-tree-select-panel>
      <div class="cngx-tree-select__tree tree">
        <div class="cngx-tree-select__node node">Alpha</div>
      </div>
    </cngx-tree-select-panel>
  </cngx-tree-select>
`;

const BASE_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  './select-base.css',
  '../tree-select/tree-select-panel.component.css',
];

@Component({
  selector: 'cngx-select-bridge-padding-host',
  standalone: true,
  styleUrls: [...BASE_STYLES, './select-bridge-padding.spec-host.scss'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: TEMPLATE,
})
class BridgedHost {}

@Component({
  selector: 'cngx-select-default-padding-host',
  standalone: true,
  styleUrls: BASE_STYLES,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: TEMPLATE,
})
class DefaultHost {}

let mountedRoot: HTMLElement | null = null;

function mount(host: new () => unknown): HTMLElement {
  const fixture = TestBed.createComponent(host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select Material bridge panel and tree padding', () => {
  it('keeps the scale insets without the bridge', () => {
    const root = mount(DefaultHost);
    expect(computedValue(one(root, '.panel'), 'padding-top')).toBe('4px');
    expect(computedValue(one(root, '.tree'), 'padding-top')).toBe('4px');
    expect(computedValue(one(root, '.node'), 'padding-inline-end')).toBe('8px');
  });

  it('zeroes the panel padding under the bridge', () => {
    const root = mount(BridgedHost);
    const panel = one(root, '.panel');
    expect(computedValue(panel, 'padding-top')).toBe('0px');
    expect(computedValue(panel, 'padding-left')).toBe('0px');
  });

  it('zeroes the tree padding under the bridge', () => {
    const root = mount(BridgedHost);
    const tree = one(root, '.tree');
    expect(computedValue(tree, 'padding-top')).toBe('0px');
    expect(computedValue(tree, 'padding-left')).toBe('0px');
  });

  it('gives a tree node the 16px option end padding under the bridge', () => {
    const root = mount(BridgedHost);
    expect(computedValue(one(root, '.node'), 'padding-inline-end')).toBe('16px');
  });
});
