import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorLoadMore } from './paginator-load-more.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorLoadMore],
  template: `
    <cngx-paginator
      [total]="total()"
      [state]="state()"
      [pageIndex]="index()"
      (pageIndexChange)="index.set($event)"
    >
      <cngx-pgn-load-more />
    </cngx-paginator>
  `,
})
class HostCmp {
  readonly total = signal(100); // 10 pages of 10
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  readonly index = signal<number | undefined>(undefined);
}

const providers = [provideZonelessChangeDetection()];

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  host: HostCmp;
  paginate: CngxPaginate;
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
  const paginate = fixture.debugElement
    .query(By.directive(CngxPaginator))
    .injector.get(CngxPaginate);
  return { fixture, host: fixture.componentInstance, paginate };
}

function button(fixture: Plumbing['fixture']): HTMLButtonElement {
  return fixture.debugElement.query(By.css('cngx-pgn-load-more button'))
    .nativeElement as HTMLButtonElement;
}

describe('CngxPaginatorLoadMore', () => {
  test('labels the button from the EN config default', async () => {
    const { fixture } = await setup();
    expect(button(fixture).getAttribute('aria-label')).toBe('Load more');
  });

  test('renders the cumulative shown / total count readout', async () => {
    const { fixture, paginate } = await setup();
    expect(button(fixture).textContent?.replace(/\s+/g, ' ').trim()).toBe('Load more 10 / 100');

    paginate.next();
    await settle(fixture);
    expect(button(fixture).textContent?.replace(/\s+/g, ' ').trim()).toBe('Load more 20 / 100');
  });

  test('clamps the shown count to total on a partial final page', async () => {
    const { fixture, host, paginate } = await setup();
    host.total.set(25); // 3 pages of 10
    await settle(fixture);

    paginate.next();
    paginate.next(); // page index 2 -> cumulative end 30, clamped to 25
    await settle(fixture);
    expect(button(fixture).textContent?.replace(/\s+/g, ' ').trim()).toBe('Load more 25 / 25');
  });

  test('clicking advances one page through host.next()', async () => {
    const { fixture, paginate } = await setup();
    button(fixture).click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(1);
  });

  test('is disabled and a no-op on the last page', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(9);
    await settle(fixture);

    expect(button(fixture).getAttribute('aria-disabled')).toBe('true');
    button(fixture).click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(9);
  });

  test('is disabled and drops clicks while busy', async () => {
    const { fixture, host, paginate } = await setup();
    paginate.setPage(2);
    await settle(fixture);

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    expect(button(fixture).getAttribute('aria-disabled')).toBe('true');
    button(fixture).click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(2);
  });
});
