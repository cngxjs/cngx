import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxSort } from './sort.directive';

@Component({
  template: '<div cngxSort></div>',
  imports: [CngxSort],
})
class TestHost {}

describe('CngxSort', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function getDir(): CngxSort {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(CngxSort)).injector.get(CngxSort);
  }

  it('starts with no active sort', () => {
    const dir = getDir();
    expect(dir.sort()).toBeNull();
    expect(dir.isActive()).toBe(false);
  });

  it('setSort sets active field with asc direction', () => {
    const dir = getDir();
    dir.setSort('name');
    expect(dir.active()).toBe('name');
    expect(dir.direction()).toBe('asc');
    expect(dir.sort()).toEqual({ active: 'name', direction: 'asc' });
  });

  it('setSort on same field toggles direction asc → desc', () => {
    const dir = getDir();
    dir.setSort('name');
    dir.setSort('name');
    expect(dir.direction()).toBe('desc');
  });

  it('setSort on same field toggles direction desc → asc', () => {
    const dir = getDir();
    dir.setSort('name');
    dir.setSort('name');
    dir.setSort('name');
    expect(dir.direction()).toBe('asc');
  });

  it('setSort on a different field resets to asc', () => {
    const dir = getDir();
    dir.setSort('name');
    dir.setSort('name'); // desc
    dir.setSort('age');
    expect(dir.active()).toBe('age');
    expect(dir.direction()).toBe('asc');
  });

  it('clear() removes active sort', () => {
    const dir = getDir();
    dir.setSort('name');
    dir.clear();
    expect(dir.sort()).toBeNull();
    expect(dir.isActive()).toBe(false);
  });

  it('emits sortChange on setSort', () => {
    const dir = getDir();
    const spy = vi.fn();
    dir.sortChange.subscribe(spy);
    dir.setSort('name');
    expect(spy).toHaveBeenCalledWith({ active: 'name', direction: 'asc' });
  });
});
