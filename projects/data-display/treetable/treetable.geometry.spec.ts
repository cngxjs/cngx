import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTreetable } from './treetable.component';
import type { Node } from './models';

// Runs in a real Chromium (the `test-geometry` target). Three browser-only
// invariants the `@scope (.cngx-treetable)` block SETs in `@layer
// cngx.components` (treetable.component.css:509), each `''` under jsdom:
//
//   1. The CSS-table display chain. The CDK custom elements (`cdk-table`,
//      `cdk-row`, `cdk-cell`) carry no default `display`; the whole visual
//      table lives in the scope. If the root stops matching - class dropped,
//      layer re-ordered, encapsulation flipped - every element falls back to
//      `display: inline` and the table collapses.
//   2. Depth indentation. `.cngx-treetable__first-data-cell` adds
//      `--cngx-row-depth * indent` to its inline-start padding
//      (treetable-row.directive.ts:29 SETs the depth), so each tree level steps
//      in by one indent. This is what makes a treetable read as a tree.
//   3. Scale-derived density. `:scope` SETs the cell padding from the
//      `--cngx-space-*` scale, so a `[data-density]` swap (which re-scales
//      `--cngx-space-*`) compacts the cells. Guarded here by driving the scale
//      token directly - the treetable's own half of the contract.

interface Item {
  name: string;
  age: number;
}

const tree: Node<Item> = {
  value: { name: 'Alice', age: 30 },
  children: [{ value: { name: 'Bob', age: 10 } }, { value: { name: 'Carol', age: 12 } }],
};

@Component({
  selector: 'cngx-treetable-geometry-host',
  standalone: true,
  imports: [CngxTreetable],
  template: `<cngx-treetable [tree]="tree" />`,
})
class TreetableHost {
  tree: Node<Item> = tree;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TreetableHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-treetable');
  if (!host) {
    throw new Error('cngx-treetable did not render');
  }
  return host as HTMLElement;
}

function displayOf(root: HTMLElement, selector: string): string {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return computedValue(el, 'display');
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxTreetable geometry', () => {
  it('resolves the CSS-table display chain from the @scope root', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('block');
    expect(displayOf(host, 'cdk-table')).toBe('table');
    expect(displayOf(host, 'cdk-header-row')).toBe('table-row');
    expect(displayOf(host, 'cdk-header-cell')).toBe('table-cell');
    expect(displayOf(host, 'cdk-row')).toBe('table-row');
    expect(displayOf(host, 'cdk-cell')).toBe('table-cell');
  });

  it('floors the expand toggle as a centred inline-flex tap target', () => {
    // The twisty renders only for a node with children (Alice). The
    // touch-target floor rule turns it into an inline-flex box so the glyph
    // stays centred while `min-inline-size` / `min-block-size` hold the hit box.
    const host = mount();
    expect(displayOf(host, '.cngx-treetable__toggle')).toBe('inline-flex');
  });

  it('indents the first data cell by one step per tree depth', () => {
    // Rows render fully expanded: Alice (depth 0), then Bob / Carol (depth 1),
    // each carrying a `.cngx-treetable__first-data-cell`. The depth-1 cell's
    // inline-start padding is the depth-0 cell's plus exactly one indent step
    // (the shared base padding cancels in the delta), so this holds regardless
    // of how `--cngx-space-md` resolves in the test document. 1.5rem == 24px at
    // the 16px root.
    const host = mount();
    const cells = host.querySelectorAll('.cngx-treetable__first-data-cell');
    const rootPad = parseFloat(computedValue(cells[0], 'padding-inline-start'));
    const childPad = parseFloat(computedValue(cells[1], 'padding-inline-start'));
    expect(childPad).toBeGreaterThan(rootPad);
    expect(childPad - rootPad).toBeCloseTo(24, 1);
  });

  it('derives cell inline padding from the --cngx-space scale', () => {
    // `:scope` SETs `--cngx-treetable-cell-padding-inline: var(--cngx-space-md)`
    // and the token is registered inherits:true, so a scale change reaches the
    // cdk cell. Driving `--cngx-space-md` on the host mimics what a
    // `[data-density]` ancestor does to the scale; the plain data cell's padding
    // tracks it. jsdom cannot resolve either read.
    const host = mount();
    const cell = host.querySelector(
      'cdk-cell:not(.cngx-treetable__expand-cell):not(.cngx-treetable__select-cell):not(.cngx-treetable__first-data-cell)',
    );
    if (!cell) {
      throw new Error('plain data cell did not render');
    }
    host.style.setProperty('--cngx-space-md', '8px');
    expect(computedValue(cell, 'padding-inline-start')).toBe('8px');
    host.style.setProperty('--cngx-space-md', '24px');
    expect(computedValue(cell, 'padding-inline-start')).toBe('24px');
  });

  it('isolates data cells under dir=rtl (isolate-only by default; direction untouched)', () => {
    document.documentElement.dir = 'rtl';
    const host = mount();
    const cell = host.querySelector(
      'cdk-cell:not(.cngx-treetable__expand-cell):not(.cngx-treetable__select-cell):not(.cngx-treetable__first-data-cell)',
    );
    if (!cell) {
      throw new Error('plain data cell did not render');
    }
    // Default: isolate fences arbitrary consumer content without forcing a
    // direction, so a genuinely RTL text cell keeps its native order.
    expect(computedValue(cell, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(cell, 'direction')).toBe('rtl');
  });

  it('pins direction:ltr on a numeric column via the opt-in token under dir=rtl', () => {
    document.documentElement.dir = 'rtl';
    const host = mount();
    const cell = host.querySelector(
      'cdk-cell:not(.cngx-treetable__expand-cell):not(.cngx-treetable__select-cell):not(.cngx-treetable__first-data-cell)',
    ) as HTMLElement | null;
    if (!cell) {
      throw new Error('plain data cell did not render');
    }
    // A pure-numeric/code/date column opts into LTR pinning without a template
    // change: the direction token flips the isolated box to ltr.
    host.style.setProperty('--cngx-treetable-cell-direction', 'ltr');
    expect(computedValue(cell, 'direction')).toBe('ltr');
  });
});
