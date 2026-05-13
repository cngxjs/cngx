import { Component, effect, signal, untracked, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxFilter } from '@cngx/common/data';
import { describe, expect, it } from 'vitest';

import { createFilterExpression, createFilterGroup, toFilterPredicate } from './filter-builder.helpers';
import type { FilterFieldDef, FilterGroup } from './filter-builder.types';

interface Person {
  readonly name: string;
  readonly age: number;
}

const PEOPLE: readonly Person[] = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Alfred', age: 40 },
];

const FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
  { key: 'age', label: 'Age', editorType: 'number' },
];

@Component({
  template: '<div [cngxFilter]="null"></div>',
  imports: [CngxFilter],
})
class BridgeHost {
  readonly tree = signal<FilterGroup | null>(null);
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  readonly filterRef = viewChild.required(CngxFilter<Person>);

  constructor() {
    const treeSig = this.tree;
    const fieldsSig = this.fields;
    const filterRefSig = this.filterRef;
    effect(() => {
      const filter = filterRefSig();
      const tree = treeSig();
      const fields = fieldsSig();
      untracked(() => {
        filter.setPredicate(toFilterPredicate<Person>(tree, fields));
      });
    });
  }
}

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<BridgeHost>>;
  host: BridgeHost;
} {
  const fixture = TestBed.createComponent(BridgeHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  return { fixture, host: fixture.componentInstance };
}

describe('toFilterPredicate + CngxFilter bridge', () => {
  it('initial null tree leaves the filter with no active predicate', () => {
    const { host } = setup();
    expect(host.filterRef().isActive()).toBe(false);
    expect(host.filterRef().predicate()).toBeNull();
  });

  it('tree update flows through the effect into CngxFilter.setPredicate', () => {
    const { fixture, host } = setup();

    host.tree.set(createFilterGroup('and', [createFilterExpression('name', 'startsWith', 'Al')]));
    fixture.detectChanges();
    TestBed.flushEffects();

    const predicate = host.filterRef().predicate();
    expect(predicate).not.toBeNull();
    const filtered = PEOPLE.filter((p) => predicate!(p));
    expect(filtered.map((p) => p.name)).toEqual(['Alice', 'Alfred']);
  });

  it('clearing the tree to null deactivates the predicate', () => {
    const { fixture, host } = setup();

    host.tree.set(createFilterGroup('and', [createFilterExpression('age', 'gt', 28)]));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.filterRef().isActive()).toBe(true);

    host.tree.set(null);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.filterRef().isActive()).toBe(false);
  });

  it('destroying the host tears the effect down without leak', () => {
    const { fixture, host } = setup();

    host.tree.set(createFilterGroup('and', [createFilterExpression('age', 'gte', 30)]));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.filterRef().isActive()).toBe(true);

    fixture.destroy();

    expect(() => {
      host.tree.set(createFilterGroup('and', [createFilterExpression('age', 'lt', 30)]));
    }).not.toThrow();
  });
});
