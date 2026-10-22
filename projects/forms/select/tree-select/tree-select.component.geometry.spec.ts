import { Component, signal, ViewEncapsulation } from '@angular/core';
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

  it('starts the value at the shared md inline padding of the field box', () => {
    const host = mount();
    // No system tokens in this harness: pin the two scale rungs the trigger
    // padding SETs from, so the assertion reads the rung, not a fallback.
    host.style.setProperty('--cngx-space-sm', '8px');
    host.style.setProperty('--cngx-space-md', '16px');
    const trigger = query(host, '.cngx-field-trigger');
    expect(computedValue(trigger, 'padding-inline-start')).toBe('16px');
    expect(computedValue(trigger, 'padding-inline-end')).toBe('16px');
  });
});

// The collapsed panel twisty chevron is directional and must point inline-end (left
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

// Under the touch floor the twisty grows to `--cngx-target-min` while a leaf's
// spacer kept its 1.25rem, so a leaf child's checkbox sat inline-start of its
// parent's. Every child must start inline-end of its parent by at least one
// indent step, in both directions (RTL mirrors: inline-end is the left side).
interface Deep {
  readonly id: string;
}

function deepTree(): CngxTreeNode<Deep>[] {
  return [
    {
      value: { id: 'p' },
      children: [
        {
          value: { id: 'c' },
          children: [{ value: { id: 'g' } }],
        },
        { value: { id: 'c2' } },
      ],
    },
  ];
}

@Component({
  selector: 'cngx-tree-select-touch-indent-host',
  standalone: true,
  imports: [CngxTreeSelect],
  template: `
    <div style="--cngx-target-min: 44px; width: 20rem">
      <cngx-tree-select
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="idFn"
        [keyFn]="idFn"
        initiallyExpanded="all"
      />
    </div>
  `,
})
class TouchIndentHost {
  readonly nodes = deepTree();
  readonly idFn = (v: Deep): string => v.id;
}

function openTouchIndentPanel(): HTMLElement {
  const fixture = TestBed.createComponent(TouchIndentHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const trigger = query(mountedRoot, '[role="combobox"]');
  trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  );
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return mountedRoot;
}

// The default indent step (1.25rem) at the 16px root; the floored step may be
// wider, never narrower.
const MIN_STEP_PX = 20;

function indicatorRect(root: HTMLElement, depth: number, nth = 0): DOMRect {
  const rows = root.querySelectorAll<HTMLElement>(`[role="treeitem"][aria-level="${depth + 1}"]`);
  const row = rows[nth];
  if (!row) {
    throw new Error(`no treeitem at depth ${depth}`);
  }
  return query(row, 'cngx-checkbox-indicator').getBoundingClientRect();
}

describe('CngxTreeSelect indent under the touch floor', () => {
  it('starts every child checkbox inline-end of its parent in LTR', () => {
    const root = openTouchIndentPanel();
    const parent = indicatorRect(root, 0);
    const child = indicatorRect(root, 1);
    const leafChild = indicatorRect(root, 1, 1);
    const grandchild = indicatorRect(root, 2);
    expect(child.left - parent.left).toBeGreaterThanOrEqual(MIN_STEP_PX);
    expect(leafChild.left - parent.left).toBeGreaterThanOrEqual(MIN_STEP_PX);
    expect(grandchild.left - child.left).toBeGreaterThanOrEqual(MIN_STEP_PX);
    // Leaf and parent siblings line up: the spacer floors like the twisty.
    expect(leafChild.left).toBe(child.left);
  });

  it('starts every child checkbox inline-end of its parent in RTL', () => {
    document.documentElement.dir = 'rtl';
    const root = openTouchIndentPanel();
    const parent = indicatorRect(root, 0);
    const child = indicatorRect(root, 1);
    const leafChild = indicatorRect(root, 1, 1);
    const grandchild = indicatorRect(root, 2);
    expect(parent.right - child.right).toBeGreaterThanOrEqual(MIN_STEP_PX);
    expect(parent.right - leafChild.right).toBeGreaterThanOrEqual(MIN_STEP_PX);
    expect(child.right - grandchild.right).toBeGreaterThanOrEqual(MIN_STEP_PX);
    expect(leafChild.right).toBe(child.right);
  });
});

// Selection rides on the checkbox and aria-checked, not a row fill: a checked
// row stays transparent and its label gains weight, while the transient
// keyboard-active row keeps its highlight fill.
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

describe('CngxTreeSelect selected row', () => {
  it('paints no fill on a checked row and keeps the active highlight', () => {
    const { fixture } = mountOpenTwisty();
    const host = fixture.componentInstance;
    host.values.set([{ id: 'b', name: 'Bravo' }]);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const checked = query(mountedRoot!, '[role="treeitem"][aria-checked="true"]');
    expect(checked.id).not.toBe('');
    expect(checked.classList.contains('cngx-tree-select__node--active')).toBe(false);
    expect(computedValue(checked, 'background-color')).toBe(TRANSPARENT);
    expect(Number(computedValue(query(checked, '.cngx-tree-select__label'), 'font-weight'))).toBe(
      600,
    );

    const active = query(mountedRoot!, '.cngx-tree-select__node--active');
    expect(active.getAttribute('aria-checked')).toBe('false');
    expect(computedValue(active, 'background-color')).not.toBe(TRANSPARENT);
    expect(Number(computedValue(query(active, '.cngx-tree-select__label'), 'font-weight'))).toBe(
      400,
    );
  });
});

// The anchored tree panel needs room for depth: at least 16rem wide even under
// a narrow trigger, capped at 20rem tall. Tree-local tokens only; the sheet
// presentation keeps the family geometry.
describe('CngxTreeSelect anchored panel size', () => {
  it('opens at least 16rem wide with a 20rem height cap', () => {
    const { fixture } = mountOpenTwisty();
    fixture.detectChanges();
    const panel = query(mountedRoot!, '.cngx-select__panel');
    expect(panel.matches(':popover-open')).toBe(true);
    expect(panel.getBoundingClientRect().width).toBeGreaterThanOrEqual(256);
    expect(computedValue(panel, 'max-height')).toBe('320px');
  });

  it('honours the tree panel tokens set on an ancestor', () => {
    const { fixture } = mountOpenTwisty();
    mountedRoot!.style.setProperty('--cngx-tree-select-panel-min-inline-size', '20rem');
    mountedRoot!.style.setProperty('--cngx-tree-select-panel-max-block-size', '12rem');
    fixture.detectChanges();
    const panel = query(mountedRoot!, '.cngx-select__panel');
    expect(panel.getBoundingClientRect().width).toBeGreaterThanOrEqual(320);
    expect(computedValue(panel, 'max-height')).toBe('192px');
  });

  it('leaves the sheet presentation on the family geometry', () => {
    mountOpenTwisty();
    const panel = query(mountedRoot!, '.cngx-select__panel');
    panel.classList.add('cngx-popover-sheet');
    panel.setAttribute('data-cngx-presentation', 'sheet');
    expect(computedValue(panel, 'max-height')).toBe('256px');
  });
});

// Depth guide lines: a row at depth d carries a `::before` spanning d indent
// steps from the base indent, painting one line per ancestor level centred
// under that ancestor's twisty. Under the 44px floor the step is 22px and the
// twisty 44px wide, so the first line sits at base 8px + 22px - half the 1px
// line. `--cngx-tree-select-guide-width: 0px` switches the lines off.
function guideOf(root: HTMLElement, depth: number): CSSStyleDeclaration {
  const row = root.querySelector<HTMLElement>(`[role="treeitem"][aria-level="${depth + 1}"]`);
  if (!row) {
    throw new Error(`no treeitem at depth ${depth}`);
  }
  return getComputedStyle(row, '::before');
}

describe('CngxTreeSelect depth guide lines', () => {
  it('spans two indent steps on a depth-2 row, from the inline-start side in LTR', () => {
    const root = openTouchIndentPanel();
    const guide = guideOf(root, 2);
    expect(guide.position).toBe('absolute');
    expect(guide.pointerEvents).toBe('none');
    expect(guide.width).toBe('44px');
    expect(guide.left).toBe('29.5px');
    expect(guide.backgroundImage).toMatch(/^linear-gradient\(to right, .+ 1px, .+ 1px\)$/);
    expect(guide.backgroundSize).toBe('22px 100%');
    expect(guideOf(root, 0).width).toBe('0px');
  });

  it('mirrors to the inline-start side in RTL', () => {
    document.documentElement.dir = 'rtl';
    const root = openTouchIndentPanel();
    const guide = guideOf(root, 2);
    expect(guide.width).toBe('44px');
    expect(guide.right).toBe('29.5px');
    expect(guide.backgroundImage).toMatch(/^linear-gradient\(to left, /);
    expect(guide.backgroundPositionX).toBe('100%');
  });

  it('paints no line at guide width 0px', () => {
    const root = openTouchIndentPanel();
    root.style.setProperty('--cngx-tree-select-guide-width', '0px');
    expect(guideOf(root, 2).backgroundImage).toMatch(/ 0px, .+ 0px\)$/);
  });
});

// The fine-pointer chip strip stays on one line: with every node selected the
// trigger is as tall as the empty trigger, in both directions.
@Component({
  selector: 'cngx-tree-select-one-line-host',
  standalone: true,
  imports: [CngxTreeSelect],
  template: `
    <div style="width: 16rem">
      <cngx-tree-select
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="idFn"
        [keyFn]="idFn"
        [(values)]="values"
      />
    </div>
  `,
})
class OneLineHost {
  readonly nodes: CngxTreeNode<Deep>[] = ['alpha', 'bravo', 'charlie', 'delta', 'echo'].map(
    (id) => ({ value: { id } }),
  );
  readonly values = signal<Deep[]>([]);
  readonly idFn = (v: Deep): string => v.id;
}

function triggerHeight(selectAll: boolean): number {
  const fixture = TestBed.createComponent(OneLineHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  if (selectAll) {
    fixture.componentInstance.values.set(fixture.componentInstance.nodes.map((n) => n.value));
  }
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const height = query(mountedRoot, '.cngx-tree-select__trigger').getBoundingClientRect().height;
  mountedRoot.remove();
  mountedRoot = null;
  return height;
}

describe('CngxTreeSelect one-line chip strip', () => {
  it('keeps the trigger height with every node selected in LTR', () => {
    expect(triggerHeight(true)).toBe(triggerHeight(false));
  });

  it('keeps the trigger height with every node selected in RTL', () => {
    document.documentElement.dir = 'rtl';
    expect(triggerHeight(true)).toBe(triggerHeight(false));
  });
});

describe('CngxTreeSelect truncated chip shrink', () => {
  it('shrinks the last chip inside the strip instead of clipping it', () => {
    const fixture = TestBed.createComponent(OneLineHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    const long = { id: 'an-unusually-long-node-label-that-cannot-fit-the-trigger' };
    fixture.componentInstance.values.set([long, { id: 'bravo' }]);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const strip = query(mountedRoot, '.cngx-select__chip-list').getBoundingClientRect();
    for (const chip of Array.from(mountedRoot.querySelectorAll('cngx-chip'))) {
      const rect = chip.getBoundingClientRect();
      expect(rect.right).toBeLessThanOrEqual(strip.right + 0.5);
      expect(rect.left).toBeGreaterThanOrEqual(strip.left - 0.5);
    }
  });
});

// The chip remove button keeps its 24px AA hit box, but on a fine pointer the
// box must stay inside its chip and clear of the label: a click aimed at the
// trigger (the label, the chip edge) must open the panel, not remove a value.
// The chip keeps the control line box. 4px is the chip's inner gap (xs).
// The shipped token layers, so chip padding and font size are the real ones.
@Component({
  selector: 'cngx-tree-select-chip-target-host',
  standalone: true,
  imports: [CngxTreeSelect],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../theming/components/cngx-field-skin.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="width: 20rem">
      <cngx-tree-select
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="idFn"
        [keyFn]="idFn"
        [(values)]="values"
      />
    </div>
  `,
})
class ChipTargetHost {
  readonly nodes: CngxTreeNode<Deep>[] = ['alpha', 'bravo'].map((id) => ({ value: { id } }));
  readonly values = signal<Deep[]>(this.nodes.map((n) => n.value));
  readonly idFn = (v: Deep): string => v.id;
}

function chipBoxes(rtl: boolean): { chip: DOMRect; label: DOMRect; remove: DOMRect }[] {
  if (rtl) {
    document.documentElement.dir = 'rtl';
  }
  const fixture = TestBed.createComponent(ChipTargetHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return Array.from(mountedRoot.querySelectorAll('cngx-chip')).map((chip) => ({
    chip: chip.getBoundingClientRect(),
    label: query(chip as HTMLElement, '.cngx-chip__label').getBoundingClientRect(),
    remove: query(chip as HTMLElement, '.cngx-chip__remove').getBoundingClientRect(),
  }));
}

describe('CngxTreeSelect chip remove target', () => {
  for (const rtl of [false, true]) {
    it(`keeps each remove hit box inside its chip and clear of the label (${rtl ? 'rtl' : 'ltr'})`, () => {
      const boxes = chipBoxes(rtl);
      expect(boxes.length).toBe(2);
      for (const { chip, label, remove } of boxes) {
        expect(remove.width).toBeGreaterThanOrEqual(24);
        const clearance = rtl ? label.left - remove.right : remove.left - label.right;
        expect(clearance).toBeGreaterThanOrEqual(4);
        expect(remove.left).toBeGreaterThanOrEqual(chip.left - 0.5);
        expect(remove.right).toBeLessThanOrEqual(chip.right + 0.5);
        expect(chip.height).toBe(24);
      }
    });
  }
});
