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
});
