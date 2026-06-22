import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate } from '@cngx/common/data';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorRail } from './paginator-rail.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorRail],
  template: `
    <cngx-paginator
      skin="rail"
      [total]="total()"
      [pageIndex]="index()"
      (pageIndexChange)="index.set($event)"
    >
      <cngx-pgn-rail />
    </cngx-paginator>
  `,
})
class HostCmp {
  readonly total = signal(100); // 10 pages of 10
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

function progress(fixture: Plumbing['fixture']): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector('cngx-progress');
}

function knob(fixture: Plumbing['fixture']): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector('.cngx-paginator__rail-knob');
}

describe('CngxPaginatorRail', () => {
  test('fills 0% on the first page and feeds the composed progressbar', async () => {
    const { fixture } = await setup();
    const bar = progress(fixture);
    expect(bar).not.toBeNull();
    // Composed CngxProgress owns the progressbar role + value (not reinvented).
    expect(bar?.getAttribute('role')).toBe('progressbar');
    expect(bar?.getAttribute('aria-valuenow')).toBe('0');
    expect(bar?.getAttribute('aria-label')).toBe('Page position');
    expect(knob(fixture)?.style.insetInlineStart).toBe('0%');
  });

  test('fills 100% on the last page; the knob rides the fill edge', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(9); // last of 10
    await settle(fixture);
    expect(progress(fixture)?.getAttribute('aria-valuenow')).toBe('100');
    expect(knob(fixture)?.style.insetInlineStart).toBe('100%');
  });

  test('a mid page fills proportionally across the span', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(5); // 5 / (10 - 1) ~= 55.56%
    await settle(fixture);
    // CngxProgress rounds the value; the knob carries the precise percentage.
    expect(progress(fixture)?.getAttribute('aria-valuenow')).toBe('56');
    expect(knob(fixture)?.style.insetInlineStart).toMatch(/^55\.5/);
  });

  test('the knob is decorative (aria-hidden), leaving the progressbar as the AT surface', async () => {
    const { fixture } = await setup();
    expect(knob(fixture)?.getAttribute('aria-hidden')).toBe('true');
  });
});
