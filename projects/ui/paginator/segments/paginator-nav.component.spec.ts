import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxPaginator } from '../paginator.component';
import {
  CngxPaginatorFirst,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPrev,
} from './paginator-nav.component';

@Component({
  standalone: true,
  imports: [
    CngxPaginator,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorNext,
    CngxPaginatorLast,
  ],
  template: `
    <cngx-paginator
      [total]="total()"
      [state]="state()"
      [pageIndex]="index()"
      (pageIndexChange)="index.set($event)"
    >
      <cngx-pgn-first />
      <cngx-pgn-prev />
      <cngx-pgn-next />
      <cngx-pgn-last />
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

function button(fixture: Plumbing['fixture'], selector: string): HTMLButtonElement {
  return fixture.debugElement.query(By.css(`${selector} button`)).nativeElement as HTMLButtonElement;
}

describe('paginator nav segments', () => {
  test('label each button from the EN config defaults', async () => {
    const { fixture } = await setup();
    expect(button(fixture, 'cngx-pgn-first').getAttribute('aria-label')).toBe('First page');
    expect(button(fixture, 'cngx-pgn-prev').getAttribute('aria-label')).toBe('Previous page');
    expect(button(fixture, 'cngx-pgn-next').getAttribute('aria-label')).toBe('Next page');
    expect(button(fixture, 'cngx-pgn-last').getAttribute('aria-label')).toBe('Last page');
  });

  test('each button renders its chevron glyph from the central glyph const', async () => {
    const { fixture } = await setup();
    expect(button(fixture, 'cngx-pgn-first').textContent?.trim()).toBe('«');
    expect(button(fixture, 'cngx-pgn-prev').textContent?.trim()).toBe('‹');
    expect(button(fixture, 'cngx-pgn-next').textContent?.trim()).toBe('›');
    expect(button(fixture, 'cngx-pgn-last').textContent?.trim()).toBe('»');
  });

  test('first/prev are disabled on the first page, next/last are not', async () => {
    const { fixture } = await setup();
    expect(button(fixture, 'cngx-pgn-first').getAttribute('aria-disabled')).toBe('true');
    expect(button(fixture, 'cngx-pgn-prev').getAttribute('aria-disabled')).toBe('true');
    expect(button(fixture, 'cngx-pgn-next').getAttribute('aria-disabled')).toBe('false');
    expect(button(fixture, 'cngx-pgn-last').getAttribute('aria-disabled')).toBe('false');
  });

  test('next/last are disabled on the last page, first/prev are not', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(9);
    await settle(fixture);
    expect(button(fixture, 'cngx-pgn-next').getAttribute('aria-disabled')).toBe('true');
    expect(button(fixture, 'cngx-pgn-last').getAttribute('aria-disabled')).toBe('true');
    expect(button(fixture, 'cngx-pgn-first').getAttribute('aria-disabled')).toBe('false');
    expect(button(fixture, 'cngx-pgn-prev').getAttribute('aria-disabled')).toBe('false');
  });

  test('clicking next/last/prev/first navigates through the brain', async () => {
    const { fixture, paginate } = await setup();

    button(fixture, 'cngx-pgn-next').click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(1);

    button(fixture, 'cngx-pgn-last').click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(9);

    button(fixture, 'cngx-pgn-prev').click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(8);

    button(fixture, 'cngx-pgn-first').click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(0);
  });

  test('clicking a disabled bound button is a no-op', async () => {
    const { fixture, paginate } = await setup();
    button(fixture, 'cngx-pgn-prev').click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(0);
  });

  test('all buttons report disabled and drop clicks while busy', async () => {
    const { fixture, host, paginate } = await setup();
    paginate.setPage(3);
    await settle(fixture);

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    for (const selector of ['cngx-pgn-first', 'cngx-pgn-prev', 'cngx-pgn-next', 'cngx-pgn-last']) {
      expect(button(fixture, selector).getAttribute('aria-disabled')).toBe('true');
    }

    button(fixture, 'cngx-pgn-next').click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(3);
  });
});
