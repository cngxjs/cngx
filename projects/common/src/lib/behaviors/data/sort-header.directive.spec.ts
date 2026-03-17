import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxSort } from './sort.directive';
import { CngxSortHeader } from './sort-header.directive';

@Component({
  template: `
    <div cngxSort #sort="cngxSort">
      <button cngxSortHeader="name" [cngxSortRef]="sort" #header="cngxSortHeader">Name</button>
    </div>
  `,
  imports: [CngxSort, CngxSortHeader],
})
class TestHost {}

describe('CngxSortHeader', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    const header = btn.injector.get(CngxSortHeader);
    const sortDir = fixture.debugElement
      .query(By.directive(CngxSort))
      .injector.get(CngxSort);
    return { fixture, btn, header, sortDir };
  }

  it('starts inactive', () => {
    const { header } = setup();
    expect(header.isActive()).toBe(false);
    expect(header.isAsc()).toBe(false);
    expect(header.isDesc()).toBe(false);
    expect(header.ariaSort()).toBeNull();
  });

  it('becomes active after click', () => {
    const { btn, header } = setup();
    btn.triggerEventHandler('click');
    expect(header.isActive()).toBe(true);
    expect(header.isAsc()).toBe(true);
    expect(header.ariaSort()).toBe('ascending');
  });

  it('toggles to desc on second click', () => {
    const { btn, header } = setup();
    btn.triggerEventHandler('click');
    btn.triggerEventHandler('click');
    expect(header.isDesc()).toBe(true);
    expect(header.ariaSort()).toBe('descending');
  });

  it('applies active CSS class when active', () => {
    const { fixture, btn } = setup();
    btn.triggerEventHandler('click');
    fixture.detectChanges();
    expect(btn.nativeElement.classList.contains('cngx-sort-header--active')).toBe(true);
  });

  it('delegates to cngxSortRef.setSort', () => {
    const { btn, sortDir } = setup();
    btn.triggerEventHandler('click');
    expect(sortDir.active()).toBe('name');
  });
});
