import { Component } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDirectiveFixture, spyOnOutput, type DirectiveFixture } from '@cngx/testing';
import { CngxSort } from './sort.directive';

@Component({
  template: '<div cngxSort></div>',
  imports: [CngxSort],
})
class Host {}

describe('CngxSort', () => {
  let ctx: DirectiveFixture<CngxSort, Host>;

  beforeEach(async () => {
    ctx = await createDirectiveFixture(CngxSort, Host);
  });

  it('starts with no active sort', () => {
    expect(ctx.directive.sort()).toBeNull();
    expect(ctx.directive.isActive()).toBe(false);
  });

  it('setSort sets active field with asc direction', () => {
    ctx.directive.setSort('name');
    expect(ctx.directive.active()).toBe('name');
    expect(ctx.directive.direction()).toBe('asc');
    expect(ctx.directive.sort()).toEqual({ active: 'name', direction: 'asc' });
  });

  it('setSort on same field toggles direction asc -> desc', () => {
    ctx.directive.setSort('name');
    ctx.directive.setSort('name');
    expect(ctx.directive.direction()).toBe('desc');
  });

  it('setSort on same field toggles direction desc -> asc', () => {
    ctx.directive.setSort('name');
    ctx.directive.setSort('name');
    ctx.directive.setSort('name');
    expect(ctx.directive.direction()).toBe('asc');
  });

  it('setSort on a different field resets to asc', () => {
    ctx.directive.setSort('name');
    ctx.directive.setSort('name');
    ctx.directive.setSort('age');
    expect(ctx.directive.active()).toBe('age');
    expect(ctx.directive.direction()).toBe('asc');
  });

  it('clear() removes active sort', () => {
    ctx.directive.setSort('name');
    ctx.directive.clear();
    expect(ctx.directive.sort()).toBeNull();
    expect(ctx.directive.isActive()).toBe(false);
  });

  it('emits sortChange on setSort', () => {
    const spy = spyOnOutput(ctx.directive.sortChange);
    ctx.directive.setSort('name');
    expect(spy.lastValue()).toEqual({ active: 'name', direction: 'asc' });
    spy.destroy();
  });

  it('emits sortsChange on setSort', () => {
    const spy = spyOnOutput(ctx.directive.sortsChange);
    ctx.directive.setSort('name');
    expect(spy.lastValue()).toEqual([{ active: 'name', direction: 'asc' }]);
    spy.destroy();
  });

  it('emits sortsChange with empty array on clear()', () => {
    const spy = spyOnOutput(ctx.directive.sortsChange);
    ctx.directive.setSort('name');
    ctx.directive.clear();
    expect(spy.lastValue()).toEqual([]);
    spy.destroy();
  });

  describe('multi-sort (additive = true)', () => {
    it('appends a new field as asc', () => {
      ctx.directive.setSort('name');
      ctx.directive.setSort('age', true);
      expect(ctx.directive.sorts()).toEqual([
        { active: 'name', direction: 'asc' },
        { active: 'age', direction: 'asc' },
      ]);
    });

    it('cycles an existing field asc -> desc', () => {
      ctx.directive.setSort('name');
      ctx.directive.setSort('name', true);
      expect(ctx.directive.sorts()).toEqual([{ active: 'name', direction: 'desc' }]);
    });

    it('removes a field when it is already desc', () => {
      ctx.directive.setSort('name');
      ctx.directive.setSort('name', true);
      ctx.directive.setSort('name', true);
      expect(ctx.directive.sorts()).toEqual([]);
      expect(ctx.directive.isActive()).toBe(false);
    });

    it('non-additive click replaces the full stack', () => {
      ctx.directive.setSort('name');
      ctx.directive.setSort('age', true);
      ctx.directive.setSort('role');
      expect(ctx.directive.sorts()).toEqual([{ active: 'role', direction: 'asc' }]);
    });

    it('emits sortsChange with the full stack on additive setSort', () => {
      const spy = spyOnOutput(ctx.directive.sortsChange);
      ctx.directive.setSort('name');
      ctx.directive.setSort('age', true);
      expect(spy.lastValue()).toEqual([
        { active: 'name', direction: 'asc' },
        { active: 'age', direction: 'asc' },
      ]);
      spy.destroy();
    });

    it('does not emit sortChange when the last field is removed', () => {
      ctx.directive.setSort('name');
      const spy = spyOnOutput(ctx.directive.sortChange);
      ctx.directive.setSort('name', true);
      ctx.directive.setSort('name', true);
      expect(spy.callCount()).toBe(1);
      expect(spy.values()[0]).toEqual({ active: 'name', direction: 'desc' });
      spy.destroy();
    });
  });
});
