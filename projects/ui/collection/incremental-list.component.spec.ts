import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';
import { CngxPaginatorLoadMore } from '@cngx/ui/paginator';

import {
  provideIncrementalListConfigAt,
  withIncrementalListAriaLabels,
} from './incremental-list-config';
import { CngxIncrementalList, type CngxIncrementalListSkin } from './incremental-list.component';
import { CNGX_PAGINATOR_HOST } from './incremental-list-host.token';
import { CngxIncrementalError, CngxIncrementalItem } from './incremental-list-slots';

@Component({
  standalone: true,
  imports: [CngxIncrementalList],
  template: `
    <cngx-incremental-list
      [total]="total()"
      [state]="state()"
      [pageIndex]="index()"
      [pageSize]="size()"
      [skin]="skin()"
      [virtualize]="virtualize()"
      [estimateSize]="estimateSize()"
      (pageIndexChange)="onIndex($event)"
      (pageSizeChange)="onSize($event)"
      (retry)="onRetry()"
    ></cngx-incremental-list>
  `,
})
class HostCmp {
  readonly total = signal(0);
  readonly state = signal<CngxAsyncState<number[]> | undefined>(undefined);
  readonly index = signal<number | undefined>(undefined);
  readonly size = signal<number | undefined>(undefined);
  readonly skin = signal<CngxIncrementalListSkin>('plain');
  readonly virtualize = signal(false);
  readonly estimateSize = signal(48);

  readonly indexEmits: number[] = [];
  readonly sizeEmits: number[] = [];
  retryCount = 0;

  onIndex(value: number): void {
    this.indexEmits.push(value);
  }
  onSize(value: number): void {
    this.sizeEmits.push(value);
  }
  onRetry(): void {
    this.retryCount += 1;
  }
}

@Component({
  standalone: true,
  imports: [CngxIncrementalList, CngxIncrementalItem, CngxIncrementalError],
  template: `
    <cngx-incremental-list
      [total]="total()"
      [state]="state()"
      [pageSize]="size()"
      (retry)="onRetry()"
    >
      <ng-template cngxIncrementalItem let-item let-i="index">
        <span class="custom-item">{{ i }}:{{ item }}</span>
      </ng-template>
      <ng-template cngxIncrementalError let-retry="retry" let-error="error">
        <button class="custom-retry" type="button" (click)="retry()">retry {{ error }}</button>
      </ng-template>
    </cngx-incremental-list>
  `,
})
class SlotHostCmp {
  readonly total = signal(0);
  readonly state = signal<CngxAsyncState<number[]> | undefined>(undefined);
  readonly size = signal<number | undefined>(10);
  retryCount = 0;
  onRetry(): void {
    this.retryCount += 1;
  }
}

@Component({
  standalone: true,
  imports: [CngxIncrementalList],
  viewProviders: [
    ...provideIncrementalListConfigAt(
      withIncrementalListAriaLabels({ empty: 'Nothing to display' }),
    ),
  ],
  template: `<cngx-incremental-list [total]="total()" [state]="state()" [pageSize]="size()" />`,
})
class ConfigHostCmp {
  readonly total = signal(2);
  readonly state = signal<CngxAsyncState<number[]> | undefined>(undefined);
  readonly size = signal<number | undefined>(2);
}

@Component({
  standalone: true,
  imports: [CngxIncrementalList, CngxPaginatorLoadMore],
  template: `
    <cngx-incremental-list [total]="total()" [state]="state()" [pageSize]="size()">
      <cngx-pgn-load-more cngxIncrementalTrigger />
    </cngx-incremental-list>
  `,
})
class TriggerHostCmp {
  readonly total = signal(0);
  readonly state = signal<CngxAsyncState<number[]> | undefined>(undefined);
  readonly size = signal<number | undefined>(2);
}

@Component({
  standalone: true,
  imports: [CngxIncrementalList],
  template: `<cngx-incremental-list [state]="state()" [total]="3" [pageSize]="10" [trackBy]="trackFn" />`,
})
class TrackHostCmp {
  readonly state = signal<CngxAsyncState<number[]> | undefined>(undefined);
  readonly seen: unknown[] = [];
  readonly trackFn = (_index: number, item: unknown): unknown => {
    this.seen.push(item);
    return item;
  };
}

/** Structural view of the organism's derived read surface (protected members). */
interface ListInternals {
  items(): readonly number[];
}

const providers = [provideZonelessChangeDetection()];

interface Plumbing {
  fixture: ComponentFixture<HostCmp>;
  host: HostCmp;
  paginate: CngxPaginate;
  internals: ListInternals;
  hostToken: CngxPaginate;
  listEl: HTMLElement;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

async function setup(): Promise<Plumbing> {
  TestBed.configureTestingModule({ providers });
  const fixture = TestBed.createComponent(HostCmp);
  await settle(fixture);
  const listDe = fixture.debugElement.query(By.directive(CngxIncrementalList));
  return {
    fixture,
    host: fixture.componentInstance,
    paginate: listDe.injector.get(CngxPaginate),
    internals: listDe.componentInstance as ListInternals,
    hostToken: listDe.injector.get(CNGX_PAGINATOR_HOST) as CngxPaginate,
    listEl: listDe.nativeElement as HTMLElement,
  };
}

describe('CngxIncrementalList', () => {
  test('provides CNGX_PAGINATOR_HOST as the brain via useExisting', async () => {
    const { hostToken, paginate } = await setup();
    expect(hostToken).toBe(paginate);
  });

  test('view switches loading -> content -> empty -> error from a manual state driver', async () => {
    const { fixture, host, listEl } = await setup();
    const manual = createManualState<number[]>();
    host.state.set(manual);

    // loading (first load) -> skeleton branch renders the built-in progress.
    manual.set('loading');
    await settle(fixture);
    expect(listEl.querySelector('cngx-progress')).not.toBeNull();
    expect(listEl.getAttribute('aria-busy')).toBe('true');

    // success with data -> content branch renders the accumulated slice.
    host.size.set(10);
    manual.setSuccess([1, 2, 3]);
    await settle(fixture);
    expect(listEl.querySelector('cngx-progress')).toBeNull();
    expect(listEl.querySelectorAll('.cngx-incremental-list__item')).toHaveLength(3);
    expect(listEl.getAttribute('aria-busy')).toBe('false');

    // success with an empty result -> empty branch.
    manual.setSuccess([]);
    await settle(fixture);
    expect(listEl.querySelector('.cngx-incremental-list__empty')).not.toBeNull();

    // first-load error -> error branch (fresh state, no prior success).
    const fresh = createManualState<number[]>();
    host.state.set(fresh);
    fresh.set('loading');
    fresh.setError(new Error('boom'));
    await settle(fixture);
    expect(listEl.querySelector('.cngx-incremental-list__error')).not.toBeNull();
  });

  test('exhausted renders the end-reached label only on the last page', async () => {
    const { fixture, host, listEl } = await setup();
    const manual = createManualState<number[]>();
    manual.setSuccess([1, 2, 3, 4]);
    host.state.set(manual);
    host.total.set(4);
    host.size.set(2);

    // page 0 of 2 -> not exhausted.
    host.index.set(0);
    await settle(fixture);
    expect(listEl.querySelector('.cngx-incremental-list__end')).toBeNull();

    // page 1 of 2 -> last page, end-reached label appears.
    host.index.set(1);
    await settle(fixture);
    const end = listEl.querySelector('.cngx-incremental-list__end');
    expect(end).not.toBeNull();
    expect(end?.textContent).toContain('All 4 loaded');
  });

  test('rendered slice equals data.slice(...cumulativeRange())', async () => {
    const { fixture, host, paginate, listEl } = await setup();
    const data = [10, 20, 30, 40, 50, 60];
    const manual = createManualState<number[]>();
    manual.setSuccess(data);
    host.state.set(manual);
    host.total.set(data.length);
    host.size.set(2);
    host.index.set(1);
    await settle(fixture);

    const [start, end] = paginate.cumulativeRange();
    const expected = data.slice(start, end);
    const rendered = Array.from(
      listEl.querySelectorAll('.cngx-incremental-list__item'),
      (li) => Number(li.textContent),
    );
    expect(rendered).toEqual(expected);
  });

  test('items() keeps a stable reference for a structurally equal slice (equal rule)', async () => {
    const { fixture, host, internals } = await setup();
    const manual = createManualState<number[]>();
    manual.setSuccess([1, 2, 3]);
    host.state.set(manual);
    host.size.set(10);
    await settle(fixture);
    const first = internals.items();

    // New data array, same contents -> the explicit equal fn must preserve the
    // reference so downstream consumers do not cascade.
    manual.setSuccess([1, 2, 3]);
    await settle(fixture);
    const second = internals.items();

    expect(second).toBe(first);
  });

  test('live region carries the settle message the accessible tree announces', async () => {
    const { fixture, host, listEl } = await setup();
    const manual = createManualState<number[]>();
    host.state.set(manual);
    host.total.set(2);
    host.size.set(2);

    manual.setSuccess([]);
    await settle(fixture);
    const sr = listEl.querySelector('.cngx-incremental-list__sr');
    expect(sr?.getAttribute('aria-live')).toBe('polite');
    expect(sr?.textContent?.trim()).toBe('Nothing here yet');
  });

  test('a projected item slot renders each accumulated row with its context', async () => {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(SlotHostCmp);
    await settle(fixture);
    const manual = createManualState<number[]>();
    manual.setSuccess([10, 20, 30]);
    fixture.componentInstance.state.set(manual);
    await settle(fixture);

    const custom = fixture.nativeElement.querySelectorAll('.custom-item');
    expect(custom).toHaveLength(3);
    expect(custom[1].textContent).toContain('1:20');
  });

  test('a projected error slot renders and its retry() context fires the retry output', async () => {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(SlotHostCmp);
    await settle(fixture);
    const manual = createManualState<number[]>();
    manual.set('loading');
    manual.setError(new Error('boom'));
    fixture.componentInstance.state.set(manual);
    await settle(fixture);

    const retryBtn = fixture.nativeElement.querySelector('.custom-retry') as HTMLButtonElement | null;
    expect(retryBtn).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cngx-incremental-list__error')).toBeNull();
    retryBtn?.click();
    await settle(fixture);
    expect(fixture.componentInstance.retryCount).toBe(1);
  });

  test('the built-in empty view renders cngx-empty-state', async () => {
    const { fixture, host, listEl } = await setup();
    const manual = createManualState<number[]>();
    host.state.set(manual);
    manual.setSuccess([]);
    await settle(fixture);
    expect(listEl.querySelector('cngx-empty-state.cngx-incremental-list__empty')).not.toBeNull();
  });

  test('provideIncrementalListConfigAt overrides a label at component scope', async () => {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(ConfigHostCmp);
    await settle(fixture);
    const manual = createManualState<number[]>();
    manual.setSuccess([]);
    fixture.componentInstance.state.set(manual);
    await settle(fixture);

    const sr = fixture.nativeElement.querySelector('.cngx-incremental-list__sr');
    expect(sr?.textContent?.trim()).toBe('Nothing to display');
    const empty = fixture.nativeElement.querySelector('cngx-empty-state.cngx-incremental-list__empty');
    expect(empty?.textContent).toContain('Nothing to display');
  });

  test('a projected load-more trigger advances the slice and is hidden once exhausted', async () => {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(TriggerHostCmp);
    await settle(fixture);
    const manual = createManualState<number[]>();
    manual.setSuccess([1, 2, 3, 4]);
    fixture.componentInstance.state.set(manual);
    fixture.componentInstance.total.set(4);
    await settle(fixture);

    const el = fixture.nativeElement as HTMLElement;
    // page 0 of 2: slice [0, 2) and the trigger is visible.
    expect(el.querySelectorAll('.cngx-incremental-list__item')).toHaveLength(2);
    const loadMore = el.querySelector('.cngx-paginator__load-more') as HTMLButtonElement | null;
    expect(loadMore).not.toBeNull();
    expect(el.querySelector('.cngx-incremental-list__end')).toBeNull();

    loadMore?.click();
    await settle(fixture);
    // page 1 of 2: cumulative slice [0, 4), now exhausted -> trigger gone, end label shown.
    expect(el.querySelectorAll('.cngx-incremental-list__item')).toHaveLength(4);
    expect(el.querySelector('.cngx-paginator__load-more')).toBeNull();
    expect(el.querySelector('.cngx-incremental-list__end')).not.toBeNull();
  });

  test('a subsequent-page error keeps the list visible and renders a reachable inline retry', async () => {
    const { fixture, host, listEl } = await setup();
    const manual = createManualState<number[]>();
    host.state.set(manual);
    host.size.set(10);
    manual.setSuccess([1, 2, 3]);
    await settle(fixture);
    expect(listEl.querySelectorAll('.cngx-incremental-list__item')).toHaveLength(3);

    // Error after a prior success is content+error (not a first load): the
    // accumulated rows stay, an inline error + retry appears, and AT is told.
    manual.setError(new Error('page 2 failed'));
    await settle(fixture);
    expect(listEl.querySelectorAll('.cngx-incremental-list__item')).toHaveLength(3);
    const inline = listEl.querySelector('.cngx-incremental-list__inline-error');
    expect(inline).not.toBeNull();
    // Distinct page-error phrasing (not the first-load 'Failed to load'), visible
    // and announced, so AT can tell the accumulated list survived.
    expect(inline?.textContent).toContain('Failed to load more');
    expect(listEl.querySelector('.cngx-incremental-list__sr')?.textContent?.trim()).toBe(
      'Failed to load more',
    );

    const retryBtn = inline?.querySelector('.cngx-incremental-list__retry') as
      | HTMLButtonElement
      | null;
    expect(retryBtn).not.toBeNull();
    retryBtn?.click();
    await settle(fixture);
    expect(host.retryCount).toBe(1);
  });

  test('the skin input reflects onto [data-skin] (default plain)', async () => {
    const { fixture, host, listEl } = await setup();
    expect(listEl.getAttribute('data-skin')).toBe('plain');
    host.skin.set('card');
    await settle(fixture);
    expect(listEl.getAttribute('data-skin')).toBe('card');
  });

  test('the virtualize input reflects onto [data-virtualize] (absent by default)', async () => {
    const { fixture, host, listEl } = await setup();
    expect(listEl.getAttribute('data-virtualize')).toBeNull();
    host.virtualize.set(true);
    await settle(fixture);
    expect(listEl.getAttribute('data-virtualize')).toBe('');
  });

  test('the trackBy input drives the accumulated @for identity', async () => {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(TrackHostCmp);
    await settle(fixture);
    const manual = createManualState<number[]>();
    manual.setSuccess([10, 20, 30]);
    fixture.componentInstance.state.set(manual);
    await settle(fixture);
    // The custom key fn is invoked once per revealed row.
    expect(fixture.componentInstance.seen).toEqual([10, 20, 30]);
  });
});
