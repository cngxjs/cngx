import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxFilterBuilder geometry', () => {
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
    expect(joiner.getBoundingClientRect().y).toBeGreaterThan(rows[0].getBoundingClientRect().bottom - 1);
    expect(joiner.getBoundingClientRect().bottom).toBeLessThan(rows[1].getBoundingClientRect().y + 1);
  });

  it('keeps the caret glyph at label size inside the builder', () => {
    const host = mountRaster();
    const trigger = query(host, '.cngx-filter-builder__field-select .cngx-select__trigger');
    const caret = query(host, '.cngx-select__caret');
    expect(computedValue(caret, 'font-size')).toBe(computedValue(trigger, 'font-size'));
  });

  it('floors the compact remove button on both axes via the target-min token', () => {
    const host = mountRaster();
    const remove = query(host, '.cngx-filter-builder__action-button--remove');
    // A fine pointer resolves --cngx-target-min to its inert 0px initial, so
    // the assertion pins the min-size wiring rather than a concrete 44px.
    expect(computedValue(remove, 'min-inline-size')).toBe(computedValue(remove, 'min-block-size'));
    expect(computedValue(remove, 'justify-content')).toBe('center');
  });
});
