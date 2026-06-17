import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate } from '@cngx/common/data';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorRange } from './paginator-range.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorRange],
  template: `
    <cngx-paginator
      [total]="total()"
      [pageSize]="size()"
      [pageIndex]="index()"
      (pageIndexChange)="index.set($event)"
    >
      <cngx-pgn-range />
    </cngx-paginator>
  `,
})
class HostCmp {
  readonly total = signal(100);
  readonly size = signal<number | undefined>(undefined);
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

function rangeText(fixture: Plumbing['fixture']): string {
  return (
    fixture.nativeElement.querySelector('.cngx-paginator__range')?.textContent?.trim() ?? ''
  );
}

describe('CngxPaginatorRange', () => {
  test('renders 1-based start-end of total for the first page', async () => {
    const { fixture } = await setup();
    expect(rangeText(fixture)).toBe('1-10 of 100');
  });

  test('tracks the active page', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(3);
    await settle(fixture);
    expect(rangeText(fixture)).toBe('31-40 of 100');
  });

  test('clamps the last partial page to total', async () => {
    const { fixture, host, paginate } = await setup();
    host.total.set(95); // 10 pages, last page holds 5 items
    await settle(fixture);
    paginate.last();
    await settle(fixture);
    expect(rangeText(fixture)).toBe('91-95 of 95');
  });

  test('shows a zero start when there are no items', async () => {
    const { fixture, host } = await setup();
    host.total.set(0);
    await settle(fixture);
    expect(rangeText(fixture)).toBe('0-0 of 0');
  });
});
