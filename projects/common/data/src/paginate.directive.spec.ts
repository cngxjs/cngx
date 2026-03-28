import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { CngxAsyncState } from '@cngx/core/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxPaginate } from './paginate.directive';

@Component({
  template: '<div cngxPaginate [total]="total"></div>',
  imports: [CngxPaginate],
})
class TestHost {
  total = 100;
}

function getDir(total = 100): CngxPaginate {
  const fixture = TestBed.createComponent(TestHost);
  fixture.componentInstance.total = total;
  fixture.detectChanges();
  return fixture.debugElement.query(By.directive(CngxPaginate)).injector.get(CngxPaginate);
}
describe('CngxPaginate', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  it('starts at page 0 with pageSize 10', () => {
    const dir = getDir();
    expect(dir.pageIndex()).toBe(0);
    expect(dir.pageSize()).toBe(10);
  });

  it('isFirst is true on page 0', () => {
    const dir = getDir();
    expect(dir.isFirst()).toBe(true);
  });

  it('isLast is true when on last page', () => {
    const dir = getDir(20); // 2 pages of 10
    dir.setPage(1);
    expect(dir.isLast()).toBe(true);
  });

  it('range returns [0, 10] on first page', () => {
    const dir = getDir();
    expect(dir.range()).toEqual([0, 10]);
  });

  it('range shifts correctly on page 2', () => {
    const dir = getDir();
    dir.setPage(2);
    expect(dir.range()).toEqual([20, 30]);
  });

  it('totalPages rounds up correctly', () => {
    const dir = getDir(25);
    expect(dir.totalPages()).toBe(3); // ceil(25/10)
  });

  it('totalPages is at least 1 for empty list', () => {
    const dir = getDir(0);
    expect(dir.totalPages()).toBe(1);
  });

  it('setPage clamps to valid range (lower)', () => {
    const dir = getDir();
    dir.setPage(-5);
    expect(dir.pageIndex()).toBe(0);
  });

  it('setPage clamps to valid range (upper)', () => {
    const dir = getDir(20); // 2 pages
    dir.setPage(99);
    expect(dir.pageIndex()).toBe(1);
  });

  it('setPageSize changes page size', () => {
    const dir = getDir();
    dir.setPageSize(25);
    expect(dir.pageSize()).toBe(25);
  });

  it('setPageSize with resetPage=true resets to page 0', () => {
    const dir = getDir(100);
    dir.setPage(3);
    dir.setPageSize(5, true);
    expect(dir.pageIndex()).toBe(0);
  });

  it('setPageSize with resetPage=false preserves page index', () => {
    const dir = getDir(100);
    dir.setPage(2);
    dir.setPageSize(5, false);
    expect(dir.pageIndex()).toBe(2);
  });

  it('next() advances to next page', () => {
    const dir = getDir(100);
    dir.next();
    expect(dir.pageIndex()).toBe(1);
  });

  it('next() does not go past last page', () => {
    const dir = getDir(10); // 1 page of 10
    dir.next();
    expect(dir.pageIndex()).toBe(0); // clamped to last page (0)
  });

  it('previous() goes back one page', () => {
    const dir = getDir(100);
    dir.setPage(3);
    dir.previous();
    expect(dir.pageIndex()).toBe(2);
  });

  it('previous() does not go below 0', () => {
    const dir = getDir();
    dir.previous();
    expect(dir.pageIndex()).toBe(0);
  });

  it('first() goes to page 0', () => {
    const dir = getDir(100);
    dir.setPage(5);
    dir.first();
    expect(dir.pageIndex()).toBe(0);
  });

  it('last() goes to the last page', () => {
    const dir = getDir(25); // 3 pages of 10
    dir.last();
    expect(dir.pageIndex()).toBe(2);
  });

  it('pageChange emits on setPage', () => {
    const dir = getDir();
    const spy = vi.fn();
    dir.pageChange.subscribe(spy);
    dir.setPage(2);
    expect(spy).toHaveBeenCalledWith(2);
  });

  it('pageSizeChange emits on setPageSize', () => {
    const dir = getDir();
    const spy = vi.fn();
    dir.pageSizeChange.subscribe(spy);
    dir.setPageSize(20);
    expect(spy).toHaveBeenCalledWith(20);
  });

  it('pageChange also emits on setPageSize with resetPage=true', () => {
    const dir = getDir(100);
    const spy = vi.fn();
    dir.setPage(3);
    dir.pageChange.subscribe(spy);
    dir.setPageSize(5, true);
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('pageChange does NOT emit on setPageSize with resetPage=false', () => {
    const dir = getDir(100);
    const spy = vi.fn();
    dir.setPage(2);
    dir.pageChange.subscribe(spy);
    dir.setPageSize(5, false);
    expect(spy).not.toHaveBeenCalled();
  });

  describe('state input — async busy guard', () => {
    function createMockState(busy: boolean): CngxAsyncState<unknown> {
      const isBusy = signal(busy);
      return {
        status: signal(busy ? 'loading' : 'idle'),
        data: signal(undefined),
        error: signal(undefined),
        progress: signal(undefined),
        isLoading: isBusy,
        isPending: signal(false),
        isRefreshing: signal(false),
        isBusy,
        isFirstLoad: signal(false),
        isEmpty: signal(false),
        hasData: signal(false),
        isSettled: signal(!busy),
        lastUpdated: signal(undefined),
      };
    }

    @Component({
      template: '<div cngxPaginate [total]="100" [state]="state"></div>',
      imports: [CngxPaginate],
    })
    class BusyHost {
      state: CngxAsyncState<unknown> | undefined = undefined;
    }

    beforeEach(() => TestBed.configureTestingModule({ imports: [BusyHost] }));

    function getDirWithState(state?: CngxAsyncState<unknown>): CngxPaginate {
      const fixture = TestBed.createComponent(BusyHost);
      fixture.componentInstance.state = state;
      fixture.detectChanges();
      return fixture.debugElement.query(By.directive(CngxPaginate)).injector.get(CngxPaginate);
    }

    it('isBusy is false when no state bound', () => {
      const dir = getDirWithState(undefined);
      expect(dir.isBusy()).toBe(false);
    });

    it('isBusy derives from state.isBusy()', () => {
      const mockState = createMockState(true);
      const dir = getDirWithState(mockState);
      expect(dir.isBusy()).toBe(true);
    });

    it('setPage is no-op when isBusy', () => {
      const mockState = createMockState(true);
      const dir = getDirWithState(mockState);
      const spy = vi.fn();
      dir.pageChange.subscribe(spy);
      dir.setPage(2);
      expect(dir.pageIndex()).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('setPageSize is no-op when isBusy', () => {
      const mockState = createMockState(true);
      const dir = getDirWithState(mockState);
      const spy = vi.fn();
      dir.pageSizeChange.subscribe(spy);
      dir.setPageSize(25);
      expect(dir.pageSize()).toBe(10);
      expect(spy).not.toHaveBeenCalled();
    });

    it('next is no-op when isBusy', () => {
      const mockState = createMockState(true);
      const dir = getDirWithState(mockState);
      dir.next();
      expect(dir.pageIndex()).toBe(0);
    });

    it('previous is no-op when isBusy', () => {
      const mockState = createMockState(true);
      const dir = getDirWithState(mockState);
      dir.previous();
      expect(dir.pageIndex()).toBe(0);
    });
  });

  describe('controlled mode', () => {
    @Component({
      template: '<div cngxPaginate [cngxPageIndex]="idx" [total]="100"></div>',
      imports: [CngxPaginate],
    })
    class ControlledHost {
      idx: number | undefined = 3;
    }

    it('pageIndexInput overrides internal state', () => {
      TestBed.configureTestingModule({ imports: [ControlledHost] });
      const fixture = TestBed.createComponent(ControlledHost);
      fixture.detectChanges();
      const dir = fixture.debugElement.query(By.directive(CngxPaginate)).injector.get(CngxPaginate);
      expect(dir.pageIndex()).toBe(3);
    });
  });
});
