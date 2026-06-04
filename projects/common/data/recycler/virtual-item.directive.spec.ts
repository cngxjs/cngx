import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { CngxVirtualItem } from './virtual-item.directive';
import type { CngxRecycler } from './recycler';

function createMockRecycler(ariaSetSize = 100): CngxRecycler {
  return {
    ariaSetSize: signal(ariaSetSize),
    start: signal(0),
    end: signal(20),
    offsetBefore: signal(0),
    offsetAfter: signal(0),
    totalSize: signal(4800),
    placeholdersBefore: signal(0),
    placeholdersAfter: signal(0),
    isLoading: signal(false),
    isRefreshing: signal(false),
    isEmpty: signal(false),
    skeletonSlots: signal(10),
    showSkeleton: signal(false),
    firstVisible: signal(0),
    lastVisible: signal(9),
    visibleCount: signal(10),
    lostFocus: signal(null),
    pendingTarget: signal(null),
    announcement: signal(''),
    anchorTo: () => {},
    releaseAnchor: () => {},
    sliced: () => signal([]),
    measure: () => {},
    scrollToIndex: () => {},
    reset: () => {},
  } as unknown as CngxRecycler;
}

@Component({
  standalone: true,
  imports: [CngxVirtualItem],
  template: `<div [cngxVirtualItem]="recycler" [cngxVirtualItemIndex]="index()"></div>`,
})
class TestHost {
  recycler = createMockRecycler();
  index = signal(0);
}

describe('CngxVirtualItem', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  function createFixture(ariaSetSize = 100, index = 0) {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.recycler = createMockRecycler(ariaSetSize);
    fixture.componentInstance.index.set(index);
    fixture.detectChanges();
    return fixture;
  }

  it('should set aria-setsize from recycler', () => {
    const fixture = createFixture(500);
    const el = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(el.getAttribute('aria-setsize')).toBe('500');
  });

  it('should set aria-posinset as 1-based index', () => {
    const fixture = createFixture(100, 0);
    const el = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(el.getAttribute('aria-posinset')).toBe('1');
  });

  it('should compute correct aria-posinset for middle items', () => {
    const fixture = createFixture(100, 41);
    const el = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(el.getAttribute('aria-posinset')).toBe('42');
  });

  it('should set data-cngx-recycle-index', () => {
    const fixture = createFixture(100, 15);
    const el = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(el.getAttribute('data-cngx-recycle-index')).toBe('15');
  });

  it('should update aria-posinset when index changes', () => {
    const fixture = createFixture(100, 0);
    const el = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(el.getAttribute('aria-posinset')).toBe('1');

    fixture.componentInstance.index.set(9);
    fixture.detectChanges();
    expect(el.getAttribute('aria-posinset')).toBe('10');
  });
});
