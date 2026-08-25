import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
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
  // isolate:false shares the browser env; reset the forced dir so a later
  // geometry read never sees a leaked RTL root.
  document.documentElement.removeAttribute('dir');
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

// The collapsed panel twisty `▸` is directional and must point inline-end (left
// under RTL) at the node it discloses. The `:not(--open)` gate mirrors only the
// collapsed twisty; the open twisty (rotated 90deg to a neutral down-caret)
// keeps its rotate. jsdom reports `transform: ''`, so this reads the browser
// matrix. The panel renders in the popover on open (real Chromium supports the
// native popover the `test-geometry` target needs).
const TWISTY_IDENTITY = 'none';
const TWISTY_MIRROR = 'matrix(-1, 0, 0, 1, 0, 0)';

function mountOpenTwisty(): { fixture: ComponentFixture<TreeHost>; twisty: HTMLElement } {
  const fixture = TestBed.createComponent(TreeHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const trigger = mountedRoot.querySelector<HTMLElement>('[role="combobox"]');
  if (!trigger) {
    throw new Error('cngx-tree-select did not render a combobox trigger');
  }
  trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  );
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const twisty = mountedRoot.querySelector<HTMLElement>('.cngx-tree-select__twisty');
  if (!twisty) {
    throw new Error('cngx-tree-select panel did not render a twisty');
  }
  // The twisty animates `transform` over 150ms; kill it so getComputedStyle
  // returns the resolved target after a dir flip, not the tween.
  twisty.style.transition = 'none';
  return { fixture, twisty };
}

describe('CngxTreeSelect twisty glyph direction', () => {
  it('mirrors the collapsed twisty under dir=rtl, LTR stable', () => {
    const { twisty } = mountOpenTwisty();
    expect(twisty.classList.contains('cngx-tree-select__twisty--open')).toBe(false);
    expect(computedValue(twisty, 'transform')).toBe(TWISTY_IDENTITY);

    document.documentElement.dir = 'rtl';
    expect(computedValue(twisty, 'transform')).toBe(TWISTY_MIRROR);

    document.documentElement.dir = 'ltr';
    expect(computedValue(twisty, 'transform')).toBe(TWISTY_IDENTITY);
  });

  it('leaves the open twisty rotate untouched in both directions', () => {
    const { fixture, twisty } = mountOpenTwisty();
    twisty.click();
    fixture.detectChanges();
    twisty.style.transition = 'none';
    expect(twisty.classList.contains('cngx-tree-select__twisty--open')).toBe(true);
    // The open twisty is a neutral down-caret (rotate 90deg): the same resolved
    // transform under both directions, never the RTL mirror.
    const openLtr = computedValue(twisty, 'transform');
    expect(openLtr).not.toBe(TWISTY_IDENTITY);
    expect(openLtr).not.toBe(TWISTY_MIRROR);

    document.documentElement.dir = 'rtl';
    expect(computedValue(twisty, 'transform')).toBe(openLtr);
  });
});
