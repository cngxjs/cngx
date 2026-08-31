import { Component, signal } from '@angular/core';
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

@Component({
  template: `
    <div cngxSort [multiSort]="true" #sort="cngxSort">
      <button cngxSortHeader="name" [cngxSortRef]="sort" #nameH="cngxSortHeader">Name</button>
      <button cngxSortHeader="age" [cngxSortRef]="sort" #ageH="cngxSortHeader">Age</button>
    </div>
  `,
  imports: [CngxSort, CngxSortHeader],
})
class MultiSortHost {}

@Component({
  template: `
    <div cngxSort [cngxSortActive]="active()" [cngxSortDirection]="direction()" #sort="cngxSort">
      <button cngxSortHeader="name" [cngxSortRef]="sort" #header="cngxSortHeader">Name</button>
    </div>
  `,
  imports: [CngxSort, CngxSortHeader],
})
class ControlledHost {
  readonly active = signal('name');
  readonly direction = signal<'asc' | 'desc'>('asc');
}

const click = new MouseEvent('click', { shiftKey: false });
const shiftClick = new MouseEvent('click', { shiftKey: true });

describe('CngxSortHeader', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [TestHost, MultiSortHost, ControlledHost] }),
  );

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    const header = btn.injector.get(CngxSortHeader);
    const sortDir = fixture.debugElement.query(By.directive(CngxSort)).injector.get(CngxSort);
    return { fixture, btn, header, sortDir };
  }

  function setupMulti() {
    const fixture = TestBed.createComponent(MultiSortHost);
    fixture.detectChanges();
    const [nameBtn, ageBtn] = fixture.debugElement.queryAll(By.css('button'));
    const nameHeader = nameBtn.injector.get(CngxSortHeader);
    const ageHeader = ageBtn.injector.get(CngxSortHeader);
    const sortDir = fixture.debugElement.query(By.directive(CngxSort)).injector.get(CngxSort);
    return { fixture, nameBtn, ageBtn, nameHeader, ageHeader, sortDir };
  }

  it('starts inactive', () => {
    const { header } = setup();
    expect(header.isActive()).toBe(false);
    expect(header.isAsc()).toBe(false);
    expect(header.isDesc()).toBe(false);
    expect(header.ariaSort()).toBeNull();
    expect(header.priority()).toBe(0);
  });

  it('becomes active after click', () => {
    const { btn, header } = setup();
    btn.triggerEventHandler('click', click);
    expect(header.isActive()).toBe(true);
    expect(header.isAsc()).toBe(true);
    expect(header.ariaSort()).toBe('ascending');
  });

  it('toggles to desc on second click', () => {
    const { btn, header } = setup();
    btn.triggerEventHandler('click', click);
    btn.triggerEventHandler('click', click);
    expect(header.isDesc()).toBe(true);
    expect(header.ariaSort()).toBe('descending');
  });

  it('applies active CSS class when active', () => {
    const { fixture, btn } = setup();
    btn.triggerEventHandler('click', click);
    fixture.detectChanges();
    expect(btn.nativeElement.classList.contains('cngx-sort-header--active')).toBe(true);
  });

  it('delegates to cngxSortRef.setSort', () => {
    const { btn, sortDir } = setup();
    btn.triggerEventHandler('click', click);
    expect(sortDir.active()).toBe('name');
  });

  describe('multi-sort with Shift+click', () => {
    it('priority() is 0 when not in stack', () => {
      const { nameHeader, ageHeader } = setupMulti();
      expect(nameHeader.priority()).toBe(0);
      expect(ageHeader.priority()).toBe(0);
    });

    it('priority() reflects insertion order', () => {
      const { nameBtn, ageBtn, nameHeader, ageHeader } = setupMulti();
      nameBtn.triggerEventHandler('click', click);
      ageBtn.triggerEventHandler('click', shiftClick);
      expect(nameHeader.priority()).toBe(1);
      expect(ageHeader.priority()).toBe(2);
    });

    it('Shift+click adds a second column to the stack', () => {
      const { nameBtn, ageBtn, sortDir } = setupMulti();
      nameBtn.triggerEventHandler('click', click);
      ageBtn.triggerEventHandler('click', shiftClick);
      expect(sortDir.sorts()).toEqual([
        { active: 'name', direction: 'asc' },
        { active: 'age', direction: 'asc' },
      ]);
    });

    it('Shift+click on active asc column switches it to desc', () => {
      const { nameBtn, sortDir } = setupMulti();
      nameBtn.triggerEventHandler('click', click);
      nameBtn.triggerEventHandler('click', shiftClick);
      expect(sortDir.sorts()).toEqual([{ active: 'name', direction: 'desc' }]);
    });

    it('Shift+click on active desc column removes it from the stack', () => {
      const { nameBtn, sortDir } = setupMulti();
      nameBtn.triggerEventHandler('click', click);
      nameBtn.triggerEventHandler('click', shiftClick); // → desc
      nameBtn.triggerEventHandler('click', shiftClick); // → removed
      expect(sortDir.sorts()).toEqual([]);
    });

    it('plain click replaces the full stack (and toggles direction of primary)', () => {
      const { nameBtn, ageBtn, sortDir } = setupMulti();
      nameBtn.triggerEventHandler('click', click); // name asc (primary)
      ageBtn.triggerEventHandler('click', shiftClick); // age asc appended
      nameBtn.triggerEventHandler('click', click); // plain → replace, name was asc → now desc
      expect(sortDir.sorts()).toEqual([{ active: 'name', direction: 'desc' }]);
    });
  });

  describe('controlled mode', () => {
    function setupControlled() {
      const fixture = TestBed.createComponent(ControlledHost);
      fixture.detectChanges();
      const btn = fixture.debugElement.query(By.css('button'));
      const header = btn.injector.get(CngxSortHeader);
      const sortDir = fixture.debugElement.query(By.directive(CngxSort)).injector.get(CngxSort);
      return { fixture, btn, header, sortDir };
    }

    it('marks the pinned column active with aria-sort from the controlled pin', () => {
      const { btn, header } = setupControlled();
      expect(header.isActive()).toBe(true);
      expect(header.isAsc()).toBe(true);
      expect(btn.nativeElement.getAttribute('aria-sort')).toBe('ascending');
      expect(btn.nativeElement.classList.contains('cngx-sort-header--active')).toBe(true);
    });

    it('tracks controlled pin updates in aria-sort', () => {
      const { fixture, btn } = setupControlled();
      fixture.componentInstance.direction.set('desc');
      fixture.detectChanges();
      expect(btn.nativeElement.getAttribute('aria-sort')).toBe('descending');
      fixture.componentInstance.active.set('');
      fixture.detectChanges();
      expect(btn.nativeElement.getAttribute('aria-sort')).toBeNull();
    });

    it('click on the pinned column continues the cycle instead of restarting it', () => {
      const { btn, sortDir } = setupControlled();
      const emitted: (unknown | undefined)[] = [];
      sortDir.sortChange.subscribe((e) => emitted.push(e));
      btn.triggerEventHandler('click', click);
      expect(emitted).toEqual([{ active: 'name', direction: 'desc' }]);
    });
  });
});
