import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxIncrementalList } from './incremental-list.component';
import { CNGX_PAGINATOR_HOST } from './incremental-list-host.token';

@Component({
  standalone: true,
  imports: [CngxIncrementalList],
  template: `
    <cngx-incremental-list
      [total]="total()"
      [state]="state()"
      [pageIndex]="index()"
      [pageSize]="size()"
      (pageIndexChange)="onIndex($event)"
      (pageSizeChange)="onSize($event)"
    ></cngx-incremental-list>
  `,
})
class HostCmp {
  readonly total = signal(0);
  readonly state = signal<CngxAsyncState<number[]> | undefined>(undefined);
  readonly index = signal<number | undefined>(undefined);
  readonly size = signal<number | undefined>(undefined);

  readonly indexEmits: number[] = [];
  readonly sizeEmits: number[] = [];

  onIndex(value: number): void {
    this.indexEmits.push(value);
  }
  onSize(value: number): void {
    this.sizeEmits.push(value);
  }
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
});
