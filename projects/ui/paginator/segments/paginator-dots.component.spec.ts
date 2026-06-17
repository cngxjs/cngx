import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorDots } from './paginator-dots.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorDots],
  template: `
    <cngx-paginator [total]="total()" [state]="state()">
      <cngx-pgn-dots />
    </cngx-paginator>
  `,
})
class HostCmp {
  readonly total = signal(50); // 5 pages of 10
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
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

function dots(fixture: Plumbing['fixture']): HTMLButtonElement[] {
  const root = fixture.nativeElement as HTMLElement;
  return Array.from(root.querySelectorAll<HTMLButtonElement>('.cngx-paginator__dot'));
}

function sizes(fixture: Plumbing['fixture']): (string | null)[] {
  return dots(fixture).map((d) => d.getAttribute('data-size'));
}

describe('CngxPaginatorDots', () => {
  test('renders one full-size dot per page when every page fits', async () => {
    const { fixture } = await setup();
    expect(dots(fixture)).toHaveLength(5);
    expect(sizes(fixture)).toEqual(['full', 'full', 'full', 'full', 'full']);
  });

  test('the active dot carries aria-current and the page aria-label', async () => {
    const { fixture, paginate } = await setup();
    const current = dots(fixture).filter((d) => d.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('aria-label')).toBe('Page 1');

    paginate.setPage(2);
    await settle(fixture);
    const moved = dots(fixture).filter((d) => d.getAttribute('aria-current') === 'page');
    expect(moved[0].getAttribute('aria-label')).toBe('Page 3');
  });

  test('clicking a dot navigates through the brain', async () => {
    const { fixture, paginate } = await setup();
    dots(fixture)[3].click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(3);
  });

  test('caps at 7 dots and shrinks the truncated trailing edge', async () => {
    const { fixture, host } = await setup();
    host.total.set(200); // 20 pages, page 0
    await settle(fixture);
    expect(dots(fixture)).toHaveLength(7);
    // page 0: only the trailing edge is truncated.
    expect(sizes(fixture)).toEqual(['full', 'full', 'full', 'full', 'full', 'medium', 'small']);
  });

  test('shrinks both edges when the window is interior', async () => {
    const { fixture, host, paginate } = await setup();
    host.total.set(200);
    await settle(fixture);
    paginate.setPage(10);
    await settle(fixture);
    expect(sizes(fixture)).toEqual(['small', 'medium', 'full', 'full', 'full', 'medium', 'small']);
    const current = dots(fixture).find((d) => d.getAttribute('aria-current') === 'page');
    expect(current?.getAttribute('aria-label')).toBe('Page 11');
    expect(current?.getAttribute('data-size')).toBe('full');
  });

  test('marks dots aria-disabled and drops clicks while busy', async () => {
    const { fixture, host, paginate } = await setup();
    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    expect(dots(fixture).every((d) => d.getAttribute('aria-disabled') === 'true')).toBe(true);
    dots(fixture)[3].click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(0);
  });
});
