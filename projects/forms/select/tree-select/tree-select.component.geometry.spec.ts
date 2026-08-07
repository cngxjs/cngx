import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import type { CngxTreeNode } from '@cngx/utils';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTreeSelect } from './tree-select.component';

// Runs in a real Chromium (the `test-geometry` target). Covers the
// tree-select folder (both tree-select.component.css and
// tree-select-panel.component.css): the `@scope (.cngx-tree-select)` root is the
// positioned anchor the tree panel resolves against, and the trigger is a flex
// row keeping the caret intrinsic beside the chip area. jsdom reports `''`.

interface Row {
  readonly id: string;
  readonly name: string;
}

function tree(): CngxTreeNode<Row>[] {
  return [
    {
      value: { id: 'a', name: 'Alpha' },
      children: [{ value: { id: 'a1', name: 'Alpha-1' } }],
    },
    { value: { id: 'b', name: 'Bravo' } },
  ];
}

@Component({
  selector: 'cngx-tree-select-geometry-host',
  standalone: true,
  imports: [CngxTreeSelect],
  template: `
    <cngx-tree-select
      [nodes]="nodes()"
      [nodeIdFn]="idFn"
      [labelFn]="labelFn"
      [keyFn]="keyFn"
      [(values)]="values"
    />
  `,
})
class TreeHost {
  readonly nodes = signal<CngxTreeNode<Row>[]>(tree());
  readonly values = signal<Row[]>([]);
  readonly idFn = (v: Row): string => v.id;
  readonly labelFn = (v: Row): string => v.name;
  readonly keyFn = (v: Row): unknown => v.id;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TreeHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-tree-select');
  if (!host) {
    throw new Error('cngx-tree-select did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxTreeSelect geometry', () => {
  it('anchors the tree panel on the positioned __root wrapper', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-tree-select__root'), 'position')).toBe('relative');
  });

  it('lays the trigger out as a flex row with the caret pinned intrinsic', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-tree-select__trigger'), 'display')).toMatch(/flex$/);
    expect(computedValue(query(host, '.cngx-tree-select__caret'), 'flex-grow')).toBe('0');
  });
});
