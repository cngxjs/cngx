import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import { CngxInfiniteScroll } from '@cngx/common/layout';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorInfinite } from './paginator-infinite.component';

// `CngxInfiniteScroll` creates a real `IntersectionObserver` in its constructor
// effect when `enabled`. jsdom/happy-dom ship none, so stub a no-op - the
// double-fire / busy gating lives in infinite-scroll.directive.spec.ts; here we
// only assert the segment's input/output wiring to the host token.
class StubIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(_cb: unknown, _opts?: unknown) {}
}

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorInfinite],
  template: `
    <cngx-paginator
      [total]="total()"
      [state]="state()"
      [pageIndex]="index()"
      (pageIndexChange)="index.set($event)"
    >
      <cngx-pgn-infinite [root]="root()" [rootMargin]="rootMargin()" />
    </cngx-paginator>
  `,
})
class HostCmp {
  readonly total = signal(100); // 10 pages of 10
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  readonly index = signal<number | undefined>(undefined);
  readonly root = signal<string | null>(null);
  readonly rootMargin = signal('0px 0px 200px 0px');
}

const providers = [provideZonelessChangeDetection()];

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  host: HostCmp;
  paginate: CngxPaginate;
  scroll: CngxInfiniteScroll;
}

async function settle(fixture: Plumbing['fixture']): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

async function setup(): Promise<Plumbing> {
  TestBed.configureTestingModule({ providers });
  const fixture = TestBed.createComponent(HostCmp);
  await settle(fixture);
  const paginatorDe = fixture.debugElement.query(By.directive(CngxPaginator));
  const paginate = paginatorDe.injector.get(CngxPaginate);
  const scroll = fixture.debugElement.query(By.directive(CngxInfiniteScroll))
    .injector.get(CngxInfiniteScroll);
  return { fixture, host: fixture.componentInstance, paginate, scroll };
}

describe('CngxPaginatorInfinite', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', StubIntersectionObserver);
  });

  test('binds the sentinel [loading] to host.isBusy()', async () => {
    const { fixture, host, scroll } = await setup();
    expect(scroll.loading()).toBe(false);

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    expect(scroll.loading()).toBe(true);
  });

  test('binds the sentinel [enabled] to !host.isLast()', async () => {
    const { fixture, paginate, scroll } = await setup();
    expect(scroll.enabled()).toBe(true);

    paginate.setPage(9); // last page
    await settle(fixture);

    expect(scroll.enabled()).toBe(false);
  });

  test('forwards [root] and [rootMargin] to the composed directive', async () => {
    const { fixture, host, scroll } = await setup();
    expect(scroll.root()).toBeNull();
    expect(scroll.rootMargin()).toBe('0px 0px 200px 0px');

    host.root.set('.scroll-box');
    host.rootMargin.set('0px 0px 48px 0px');
    await settle(fixture);

    expect(scroll.root()).toBe('.scroll-box');
    expect(scroll.rootMargin()).toBe('0px 0px 48px 0px');
  });

  test('a loadMore emission advances the page through host.next() exactly once', async () => {
    const { fixture, paginate, scroll } = await setup();
    const next = vi.spyOn(paginate, 'next');

    scroll.loadMore.emit();
    await settle(fixture);

    expect(next).toHaveBeenCalledTimes(1);
    expect(paginate.pageIndex()).toBe(1);
  });

  test('shows the busy affordance while pages remain', async () => {
    const { fixture } = await setup();
    expect(
      fixture.debugElement.query(By.css('cngx-pgn-infinite .cngx-paginator__infinite-spinner')),
    ).not.toBeNull();
    expect(
      fixture.debugElement.query(By.css('cngx-pgn-infinite .cngx-paginator__infinite-end')),
    ).toBeNull();
  });

  test('on the last page swaps to the all-loaded end label, dropping the spinner', async () => {
    const { fixture, host, paginate } = await setup();
    host.total.set(25); // 3 pages of 10
    await settle(fixture);

    paginate.setPage(2); // last page
    await settle(fixture);

    const end = fixture.debugElement.query(
      By.css('cngx-pgn-infinite .cngx-paginator__infinite-end'),
    );
    expect(end.nativeElement.textContent.trim()).toBe('All 25 loaded');
    expect(
      fixture.debugElement.query(By.css('cngx-pgn-infinite .cngx-paginator__infinite-spinner')),
    ).toBeNull();
  });

  test('on the last page while still busy keeps the spinner, not the end label', async () => {
    const { fixture, host, paginate } = await setup();
    host.total.set(25); // 3 pages of 10
    await settle(fixture);

    paginate.setPage(2); // last page
    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy); // final batch still loading
    await settle(fixture);

    // "All loaded" must not show while the last fetch is in flight.
    expect(
      fixture.debugElement.query(By.css('cngx-pgn-infinite .cngx-paginator__infinite-end')),
    ).toBeNull();
    expect(
      fixture.debugElement.query(By.css('cngx-pgn-infinite .cngx-paginator__infinite-spinner')),
    ).not.toBeNull();

    busy.set('success'); // settle
    await settle(fixture);

    expect(
      fixture.debugElement.query(By.css('cngx-pgn-infinite .cngx-paginator__infinite-end'))
        ?.nativeElement.textContent.trim(),
    ).toBe('All 25 loaded');
  });
});
