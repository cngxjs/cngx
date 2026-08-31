import { Component, inject, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { CngxPaginate } from './paginate.directive';
import { connectPaginateEmit } from './paginate-emit';

@Component({
  standalone: true,
  template: '',
  hostDirectives: [
    {
      directive: CngxPaginate,
      inputs: ['total', 'cngxPageIndex: pageIndex', 'cngxPageSize: pageSize'],
    },
  ],
})
class BridgeHost {
  readonly paginate = inject(CngxPaginate);
  readonly indexEmits: number[] = [];
  readonly sizeEmits: number[] = [];
  constructor() {
    connectPaginateEmit(this.paginate, {
      onIndex: (index) => this.indexEmits.push(index),
      onSize: (size) => this.sizeEmits.push(size),
    });
  }
}

function setup(): { fixture: ReturnType<typeof TestBed.createComponent<BridgeHost>>; cmp: BridgeHost } {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(BridgeHost);
  fixture.componentRef.setInput('total', 100);
  fixture.detectChanges();
  TestBed.flushEffects();
  return { fixture, cmp: fixture.componentInstance };
}

describe('connectPaginateEmit', () => {
  test('mounting emits no initial change', () => {
    const { cmp } = setup();
    expect(cmp.indexEmits).toEqual([]);
    expect(cmp.sizeEmits).toEqual([]);
  });

  test('a nav emits pageIndexChange exactly once (no nav/clamp double-emit)', () => {
    const { fixture, cmp } = setup();
    cmp.paginate.setPage(3);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(cmp.indexEmits).toEqual([3]);
    expect(cmp.sizeEmits).toEqual([]);
  });

  test('a page-size change emits pageSizeChange exactly once', () => {
    const { fixture, cmp } = setup();
    cmp.paginate.setPageSize(25, false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(cmp.sizeEmits).toEqual([25]);
    expect(cmp.indexEmits).toEqual([]);
  });

  test('a total-shrink clamp emits the clamped index once (clamp path)', () => {
    const { fixture, cmp } = setup();
    cmp.paginate.setPage(5);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(cmp.indexEmits).toEqual([5]);

    // total shrinks so page 5 no longer exists -> effective pageIndex clamps to
    // page 1 with no setPage() nav; only the clamp effect reports it, once.
    fixture.componentRef.setInput('total', 20);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(cmp.indexEmits).toEqual([5, 1]);
  });

  test('signals read inside a handler do not become clamp-effect dependencies', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });

    @Component({
      standalone: true,
      template: '',
      hostDirectives: [{ directive: CngxPaginate, inputs: ['total'] }],
    })
    class TrackingHost {
      readonly paginate = inject(CngxPaginate);
      readonly unrelated = signal(0);
      readonly indexEmits: number[] = [];
      constructor() {
        connectPaginateEmit(this.paginate, {
          // A consumer handler that reads a signal synchronously - it must run
          // untracked, or `unrelated` would retrigger the clamp effect.
          onIndex: (index) => {
            this.unrelated();
            this.indexEmits.push(index);
          },
          onSize: () => {},
        });
      }
    }

    const fixture = TestBed.createComponent(TrackingHost);
    fixture.componentRef.setInput('total', 100);
    fixture.detectChanges();
    TestBed.flushEffects();
    const cmp = fixture.componentInstance;

    // Force an emit through the clamp path so the handler runs inside the effect.
    fixture.componentRef.setInput('total', 100);
    cmp.paginate.setPage(5);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.componentRef.setInput('total', 20);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(cmp.indexEmits).toEqual([5, 1]);

    // If the handler ran tracked, this write would rerun the clamp effect -
    // assert the unrelated signal triggers nothing.
    cmp.unrelated.set(1);
    TestBed.flushEffects();
    expect(cmp.indexEmits).toEqual([5, 1]);
  });
});
