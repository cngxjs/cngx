import { Component, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDirectiveFixture, type DirectiveFixture } from '@cngx/testing';
import { CngxSort } from './sort.directive';
import { createSortHeaderState } from './sort-header-state';

@Component({
  template: '<div cngxSort [multiSort]="multi()"></div>',
  imports: [CngxSort],
})
class Host {
  readonly multi = signal(false);
}

describe('createSortHeaderState', () => {
  let ctx: DirectiveFixture<CngxSort, Host>;

  beforeEach(async () => {
    ctx = await createDirectiveFixture(CngxSort, Host);
  });

  function stateFor(field: string) {
    return createSortHeaderState(
      () => ctx.directive,
      () => field,
    );
  }

  it('starts inactive', () => {
    const state = stateFor('name');
    expect(state.entry()).toBeUndefined();
    expect(state.isActive()).toBe(false);
    expect(state.isAsc()).toBe(false);
    expect(state.isDesc()).toBe(false);
    expect(state.priority()).toBe(0);
  });

  it('reflects setSort: none -> asc -> desc', () => {
    const state = stateFor('name');

    ctx.directive.setSort('name');
    expect(state.isActive()).toBe(true);
    expect(state.isAsc()).toBe(true);
    expect(state.isDesc()).toBe(false);

    ctx.directive.setSort('name');
    expect(state.isDesc()).toBe(true);
    expect(state.isAsc()).toBe(false);
  });

  it('priority is 0 when inactive and the 1-based stack position in multi-sort', () => {
    ctx.host.multi.set(true);
    ctx.flush();
    const name = stateFor('name');
    const age = stateFor('age');

    expect(name.priority()).toBe(0);
    expect(age.priority()).toBe(0);

    ctx.directive.setSort('name');
    ctx.directive.setSort('age', true);

    expect(name.priority()).toBe(1);
    expect(age.priority()).toBe(2);
  });

  it('toggle(false) calls setSort(field, false)', () => {
    stateFor('name').toggle(false);
    expect(ctx.directive.sorts()).toEqual([{ active: 'name', direction: 'asc' }]);
  });

  it('toggle(true) is not additive when multiSort is off (gate collapses to replace)', () => {
    ctx.directive.setSort('name');
    stateFor('age').toggle(true);
    // Single-sort: the Shift read is gated out, so the stack is replaced, not appended.
    expect(ctx.directive.sorts()).toEqual([{ active: 'age', direction: 'asc' }]);
  });

  it('toggle(true) is additive when multiSort is on', () => {
    ctx.host.multi.set(true);
    ctx.flush();
    stateFor('name').toggle(false);
    stateFor('age').toggle(true);
    expect(ctx.directive.sorts()).toEqual([
      { active: 'name', direction: 'asc' },
      { active: 'age', direction: 'asc' },
    ]);
  });

  it('entry returns the same reference across reads while the sort is unchanged', () => {
    const state = stateFor('name');
    ctx.directive.setSort('name');
    const first = state.entry();
    const second = state.entry();
    expect(first).toBeDefined();
    expect(Object.is(first, second)).toBe(true);
  });
});
