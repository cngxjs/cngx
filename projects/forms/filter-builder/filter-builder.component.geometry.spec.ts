import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxFilterBuilder } from './filter-builder.component';
import { createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import type { FilterFieldDef, FilterGroup } from './filter-builder.types';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (cngx-filter-builder)` block stacks each group's predicate rows in a vertical
// flex column so nested groups indent and read as a tree of conditions. jsdom
// reports `''` for the flex-direction read.

const FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
  { key: 'age', label: 'Age', editorType: 'number' },
];

@Component({
  selector: 'cngx-filter-builder-geometry-host',
  standalone: true,
  imports: [CngxFilterBuilder],
  template: `<cngx-filter-builder [fields]="fields" [(value)]="value" />`,
})
class FilterHost {
  readonly fields = FIELDS;
  // A populated root so the body renders its `.cngx-filter-builder__group`;
  // an empty root renders no group.
  value: FilterGroup = createFilterGroup('and', [createFilterExpression('name', 'eq', 'x')]);
}

@Component({
  selector: 'cngx-filter-builder-raster-host',
  standalone: true,
  imports: [CngxFilterBuilder],
  template: `<cngx-filter-builder [fields]="fields" [(value)]="value" />`,
})
class RasterHost {
  readonly fields = FIELDS;
  // Two sibling expression rows with different field/operator content so an
  // unsized (content-width) column would produce unequal widths.
  value: FilterGroup = createFilterGroup('and', [
    createFilterExpression('name', 'contains', 'x'),
    createFilterExpression('age', 'gt', 1),
  ]);
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(FilterHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-filter-builder');
  if (!host) {
    throw new Error('cngx-filter-builder did not render');
  }
  return host as HTMLElement;
}

@Component({
  selector: 'cngx-filter-builder-incomplete-host',
  standalone: true,
  imports: [CngxFilterBuilder],
  template: `<cngx-filter-builder [fields]="fields" [(value)]="value" />`,
})
class IncompleteHost {
  readonly fields = FIELDS;
  value: FilterGroup = createFilterGroup('and', [createFilterExpression('name', 'contains')]);
}

function mountIncomplete(): HTMLElement {
  const fixture = TestBed.createComponent(IncompleteHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-filter-builder');
  if (!host) {
    throw new Error('cngx-filter-builder did not render');
  }
  return host as HTMLElement;
}

function mountRaster(): HTMLElement {
  const fixture = TestBed.createComponent(RasterHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-filter-builder');
  if (!host) {
    throw new Error('cngx-filter-builder did not render');
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

// The remove glyph is text: it reads the danger TEXT rung (danger at the
// text-rung lightness), never plain danger, which sits near 4:1 on the
// page. The glyph is muted at rest and turns danger on hover / focus-visible.
// Set on the root because the delegating SET lives on :root.
const DANGER_PROPS = ['--cngx-color-danger', '--cngx-color-danger-text', '--cngx-color-text'];

function setRoot(props: Record<string, string>): void {
  for (const [name, value] of Object.entries(props)) {
    document.documentElement.style.setProperty(name, value);
  }
}

function resolvedColor(value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

// Composite a translucent fill over the page the way it renders.
function paint(...layers: string[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('no 2d context');
  }
  for (const layer of layers) {
    ctx.fillStyle = layer;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  return `rgb(${r}, ${g}, ${b})`;
}

interface DomNode {
  readonly nodeId: number;
  readonly children?: readonly DomNode[];
  readonly contentDocument?: DomNode;
}

function documentsOf(node: DomNode): DomNode[] {
  const nested = [
    ...(node.children ?? []),
    ...(node.contentDocument ? [node.contentDocument] : []),
  ];
  return [...(node.contentDocument ? [node.contentDocument] : []), ...nested.flatMap(documentsOf)];
}

// Hold :hover over CDP instead of moving a pointer. The spec runs in the runner
// iframe, so the lookup walks nested documents.
async function forceHover(selector: string): Promise<void> {
  const session = cdp();
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = (await session.send('DOM.getDocument', { depth: -1, pierce: true })) as {
    root: DomNode;
  };
  for (const doc of [root, ...documentsOf(root)]) {
    const { nodeId } = (await session.send('DOM.querySelector', {
      nodeId: doc.nodeId,
      selector,
    })) as { nodeId: number };
    if (nodeId) {
      await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
      return;
    }
  }
  throw new Error(`${selector} is in no document`);
}

const PAGE = resolvedColor('var(--cngx-color-surface, oklch(1 0 0))');

function joinerContrast(joiner: HTMLElement): number {
  const fill = paint(PAGE, computedValue(joiner, 'background-color'));
  return contrastRatio(computedValue(joiner, 'color'), fill);
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  for (const name of DANGER_PROPS) {
    document.documentElement.style.removeProperty(name);
  }
});

describe('CngxFilterBuilder geometry', () => {
  it('paints the remove glyph with the danger text colour, not plain danger', () => {
    setRoot({
      '--cngx-color-danger': 'rgb(200, 0, 0)',
      '--cngx-color-danger-text': 'rgb(10, 20, 30)',
    });
    const remove = query(mount(), '.cngx-filter-builder__action-button--remove');
    remove.focus();
    expect(remove.matches(':focus-visible')).toBe(true);
    expect(computedValue(remove, 'color')).toBe('rgb(10, 20, 30)');
  });

  it('derives the remove glyph colour from danger when no danger text rung is set', () => {
    setRoot({
      '--cngx-color-danger': 'rgb(200, 0, 0)',
      '--cngx-color-danger-text': 'initial',
      '--cngx-color-text': 'rgb(0, 0, 0)',
    });
    const remove = query(mount(), '.cngx-filter-builder__action-button--remove');
    remove.focus();
    expect(remove.matches(':focus-visible')).toBe(true);
    expect(computedValue(remove, 'color')).toBe(
      resolvedColor('oklch(from rgb(200, 0, 0) 0.46 c h)'),
    );
  });

  it('renders the builder as a block container', () => {
    expect(computedValue(mount(), 'display')).toBe('block');
  });

  it('stacks the group rows in a vertical flex column', () => {
    const host = mount();
    const group = query(host, '.cngx-filter-builder__group');
    expect(computedValue(group, 'display')).toBe('flex');
    expect(computedValue(group, 'flex-direction')).toBe('column');
  });

  it('renders each expression as one content-hugging capsule with borderless segments', () => {
    const host = mountRaster();
    const rows = Array.from(host.querySelectorAll('.cngx-filter-builder__expression'));
    expect(rows.length).toBe(2);

    for (const row of rows) {
      // The capsule carries the ONE border...
      expect(computedValue(row, 'border-top-style')).toBe('solid');
      expect(computedValue(row, 'border-top-width')).toBe('1px');
      // ...and hugs its content instead of spanning the group.
      const group = query(host, '.cngx-filter-builder__group');
      expect(row.getBoundingClientRect().width).toBeLessThan(
        group.getBoundingClientRect().width - 40,
      );
      // Segments inside are borderless: the select trigger's border is
      // transparent, the pill's own 10rem min-width default is neutralised.
      const trigger = query(row as HTMLElement, '.cngx-select__trigger');
      expect(computedValue(trigger, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
    }

    const fieldSelects = Array.from(host.querySelectorAll('.cngx-filter-builder__field-select'));
    for (const sel of fieldSelects) {
      expect(sel.getBoundingClientRect().width).toBeLessThan(120);
    }
  });

  it('lands every row control on one shared height', () => {
    const host = mountRaster();
    const trigger = query(host, '.cngx-filter-builder__field-select .cngx-select__trigger');
    const input = query(host, '.cngx-filter-builder__expression input');
    const remove = query(host, '.cngx-filter-builder__action-button--remove');

    const triggerHeight = trigger.getBoundingClientRect().height;
    const inputHeight = input.getBoundingClientRect().height;
    // Same font, line-height, block padding and border by construction.
    expect(Math.abs(triggerHeight - inputHeight)).toBeLessThanOrEqual(1);
    // The ghost remove button floors to 2rem and stays inside the raster.
    expect(remove.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
    expect(remove.getBoundingClientRect().height).toBeLessThanOrEqual(triggerHeight);
  });

  it('seats the remove button flush as the trailing segment of its capsule', () => {
    const host = mountRaster();
    const rows = Array.from(host.querySelectorAll('.cngx-filter-builder__expression'));
    for (const row of rows) {
      const remove = query(row as HTMLElement, '.cngx-filter-builder__action-button--remove');
      const rowRect = row.getBoundingClientRect();
      const removeRect = remove.getBoundingClientRect();
      expect(Math.abs(rowRect.right - 1 - removeRect.right)).toBeLessThanOrEqual(1);
      // Stretched to the capsule's full inner height (full-height divider).
      expect(Math.abs(removeRect.height - (rowRect.height - 2))).toBeLessThanOrEqual(1);
    }
  });

  it('renders the root group without a box by default', () => {
    const host = mountRaster();
    const root = query(host, '.cngx-filter-builder__group');
    expect(computedValue(root, 'border-top-width')).toBe('0px');
  });

  it('marks an unfinished value with a dashed bottom edge, not a row outline', () => {
    const host = mountIncomplete();
    const row = query(host, '.cngx-filter-expression-incomplete');
    const input = query(host, '.cngx-filter-expression-incomplete > input');
    expect(computedValue(input, 'border-bottom-style')).toBe('dashed');
    expect(computedValue(input, 'border-top-style')).toBe('none');
    expect(computedValue(row, 'outline-style')).toBe('none');
  });

  it('renders a compact joiner chip between sibling rows', () => {
    const host = mountRaster();
    const joiners = Array.from(host.querySelectorAll('.cngx-filter-builder__logic-joiner'));
    expect(joiners.length).toBe(1);
    const joiner = joiners[0] as HTMLElement;
    expect(joiner.getBoundingClientRect().width).toBeLessThan(96);
    // Sits between the two capsules in document flow.
    const rows = Array.from(host.querySelectorAll('.cngx-filter-builder__expression'));
    expect(joiner.getBoundingClientRect().y).toBeGreaterThan(
      rows[0].getBoundingClientRect().bottom - 1,
    );
    expect(joiner.getBoundingClientRect().bottom).toBeLessThan(
      rows[1].getBoundingClientRect().y + 1,
    );
  });

  it('draws the caret glyph on the 12px micro box inside the builder', () => {
    const host = mountRaster();
    const svg = query(query(host, '.cngx-select__caret'), 'svg');
    expect(svg.getBoundingClientRect().width).toBe(12);
    expect(svg.getBoundingClientRect().height).toBe(12);
  });

  it('floors the compact remove button on both axes via the target-min token', () => {
    const host = mountRaster();
    const remove = query(host, '.cngx-filter-builder__action-button--remove');
    // A fine pointer resolves --cngx-target-min to its inert 0px initial, so
    // the assertion pins the min-size wiring rather than a concrete 44px.
    expect(computedValue(remove, 'min-inline-size')).toBe(computedValue(remove, 'min-block-size'));
    expect(computedValue(remove, 'justify-content')).toBe('center');
  });

  // The joiner label is colour-only text on its own primary tint: the primary
  // text rung at rest, the text colour on the stronger hover tint.
  it('keeps the joiner label at 4.5:1 on its rest tint', () => {
    const joiner = query(mountRaster(), '.cngx-filter-builder__logic-joiner');
    expect(joinerContrast(joiner)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the joiner label at 4.5:1 on its hover tint', async () => {
    const joiner = query(mountRaster(), '.cngx-filter-builder__logic-joiner');
    const rest = computedValue(joiner, 'background-color');
    await forceHover('.cngx-filter-builder__logic-joiner');
    expect(computedValue(joiner, 'background-color')).not.toBe(rest);
    expect(joinerContrast(joiner)).toBeGreaterThanOrEqual(4.5);
  });

  it('mixes the joiner tint from a re-themed root primary', () => {
    setRoot({ '--cngx-color-primary': 'oklch(0.55 0.15 250)' });
    try {
      const joiner = query(mountRaster(), '.cngx-filter-builder__logic-joiner');
      expect(rasterise(computedValue(joiner, 'background-color'))).toEqual(
        rasterise('color-mix(in oklch, oklch(0.55 0.15 250) 12%, transparent)'),
      );
    } finally {
      document.documentElement.style.removeProperty('--cngx-color-primary');
    }
  });
});

// The focus ring is registered with a currentColor initial, so without a SET
// it paints in the text colour (black on add, red on remove, brown on the
// joiner). Inside the capsule the select trigger and the value input drew
// their own outset rings in their own shape.
describe('CngxFilterBuilder focus ring', () => {
  const PRIMARY = 'rgb(0, 0, 200)';

  function ringOf(el: HTMLElement): { color: string; offset: string } {
    el.focus();
    expect(el.matches(':focus-visible, :focus-within')).toBe(true);
    return {
      color: computedValue(el, 'outline-color'),
      offset: computedValue(el, 'outline-offset'),
    };
  }

  afterEach(() => {
    document.documentElement.style.removeProperty('--cngx-color-primary');
  });

  it('paints the action buttons and the joiner in the primary, outside the box', () => {
    setRoot({ '--cngx-color-primary': PRIMARY });
    const host = mountRaster();
    for (const selector of [
      '.cngx-filter-builder__action-button--add-filter',
      '.cngx-filter-builder__logic-joiner',
    ]) {
      expect(ringOf(query(host, selector))).toEqual({ color: PRIMARY, offset: '2px' });
    }
  });

  it('paints every capsule segment with the same inset primary ring', () => {
    setRoot({ '--cngx-color-primary': PRIMARY });
    const host = mountRaster();
    const capsule = query(host, '.cngx-filter-builder__expression');
    const segments = [
      ...Array.from(capsule.querySelectorAll<HTMLElement>('.cngx-field-trigger')),
      query(capsule, 'input[cngxInput]'),
      query(capsule, '.cngx-filter-builder__action-button--remove'),
    ];
    expect(segments.length).toBe(4);
    for (const segment of segments) {
      expect(ringOf(segment)).toEqual({ color: PRIMARY, offset: '-2px' });
    }
  });

  it('shapes the select trigger like its capsule segment', () => {
    const capsule = query(mountRaster(), '.cngx-filter-builder__expression');
    const [field, operator] = Array.from(
      capsule.querySelectorAll<HTMLElement>('.cngx-field-trigger'),
    );
    const fieldSegment = query(capsule, '.cngx-filter-builder__field-select');
    expect(computedValue(field, 'border-radius')).toBe(
      computedValue(fieldSegment, 'border-radius'),
    );
    expect(computedValue(field, 'border-top-right-radius')).toBe('0px');
    expect(computedValue(operator, 'border-radius')).toBe('0px');
  });
});
