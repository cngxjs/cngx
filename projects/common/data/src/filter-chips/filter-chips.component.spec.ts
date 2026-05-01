import { Component, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import { CngxFilter } from '../filter/filter.directive';
import { CngxFilterChips } from './filter-chips.component';

interface Tag {
  readonly id: string;
  readonly label: string;
}

const TAGS: readonly Tag[] = [
  { id: 'red', label: 'Red' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
];

@Component({
  template: `
    <ng-container [cngxFilter]="null" #filter="cngxFilter">
      @if (mounted()) {
        <cngx-filter-chips
          label="Tags"
          [options]="options"
          [optionLabel]="byLabel"
          [optionValue]="byId"
          [filterRef]="filter"
          filterKey="tags"
        />
      }
    </ng-container>
  `,
  imports: [CngxFilter, CngxFilterChips],
})
class Host {
  readonly options: readonly unknown[] = TAGS;
  readonly byLabel = (t: unknown): string => (t as Tag).label;
  readonly byId = (t: unknown): string => (t as Tag).id;
  mounted = signal(true);
  @ViewChild('filter', { static: true }) filterRef!: CngxFilter<unknown>;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  // afterNextRender fires registration after the first render
  await fixture.whenStable();
  fixture.detectChanges();
  const bridgeDe = fixture.debugElement.query(By.directive(CngxFilterChips));
  return {
    fixture,
    host: fixture.componentInstance,
    bridge: bridgeDe.injector.get(CngxFilterChips) as CngxFilterChips<unknown, string>,
    filter: fixture.componentInstance.filterRef,
  };
}

describe('CngxFilterChips', () => {
  it('registers exactly one predicate on mount via addPredicate(filterKey, fn)', async () => {
    const { filter } = await setup();
    expect(filter.predicates().has('tags')).toBe(true);
    expect(filter.predicates().size).toBe(1);
  });

  it('empty selectedValues — predicate returns true for every item (no-filter short-circuit)', async () => {
    const { filter } = await setup();
    const pred = filter.predicate();
    expect(pred).not.toBeNull();
    for (const tag of TAGS) {
      expect(pred!(tag)).toBe(true);
    }
  });

  it('selected values — predicate keeps matching items, drops the rest', async () => {
    const { fixture, bridge, filter } = await setup();
    bridge.selectedValues.set(['red', 'blue']);
    fixture.detectChanges();
    const pred = filter.predicate();
    expect(pred).not.toBeNull();
    expect(pred!({ id: 'red', label: 'Red' })).toBe(true);
    expect(pred!({ id: 'green', label: 'Green' })).toBe(false);
    expect(pred!({ id: 'blue', label: 'Blue' })).toBe(true);
  });

  it('toggling chips does NOT re-register the predicate (register-once contract via spy)', async () => {
    const { fixture, bridge, filter } = await setup();
    const addSpy = vi.spyOn(filter, 'addPredicate');
    expect(addSpy).toHaveBeenCalledTimes(0);
    bridge.selectedValues.set(['red']);
    fixture.detectChanges();
    bridge.selectedValues.set(['red', 'green']);
    fixture.detectChanges();
    bridge.selectedValues.set([]);
    fixture.detectChanges();
    bridge.selectedValues.set(['blue']);
    fixture.detectChanges();
    expect(addSpy).toHaveBeenCalledTimes(0);
  });

  it('predicate closure reads selectedValues lazily — pure derivation, not effect-driven', async () => {
    const { fixture, bridge, filter } = await setup();
    const initial = filter.predicate();
    expect(initial).not.toBeNull();
    bridge.selectedValues.set(['red']);
    fixture.detectChanges();
    const afterToggle = filter.predicate();
    // Predicate identity stays — only the closure's read of selectedValues changes.
    expect(afterToggle).toBe(initial);
    expect(afterToggle!({ id: 'green', label: 'Green' })).toBe(false);
    expect(afterToggle!({ id: 'red', label: 'Red' })).toBe(true);
  });

  it('removePredicate is called exactly once on destroy', async () => {
    const { fixture, host, filter } = await setup();
    const removeSpy = vi.spyOn(filter, 'removePredicate');
    host.mounted.set(false);
    fixture.detectChanges();
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith('tags');
    expect(filter.predicates().has('tags')).toBe(false);
  });

  it('optionLabel and optionValue functions resolve correctly through the inner chip rendering', async () => {
    const { fixture } = await setup();
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Red');
    expect(html).toContain('Green');
    expect(html).toContain('Blue');
  });
});
