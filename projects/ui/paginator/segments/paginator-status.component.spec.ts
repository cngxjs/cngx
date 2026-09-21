import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate } from '@cngx/common/data';

import { CngxPaginator } from '../paginator.component';
import {
  provideCngxPaginatorConfig,
  withPaginatorPageStatusFormat,
} from '../paginator-config';
import { CngxPaginatorStatus } from './paginator-status.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorStatus],
  template: `
    <cngx-paginator [total]="total()" [pageIndex]="index()" (pageIndexChange)="index.set($event)">
      <cngx-pgn-status />
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

function statusText(fixture: Plumbing['fixture']): string | undefined {
  return (fixture.nativeElement as HTMLElement)
    .querySelector('.cngx-paginator__status')
    ?.textContent?.trim();
}

async function setup(extraProviders: unknown[] = []): Promise<Plumbing> {
  TestBed.configureTestingModule({ providers: [...providers, ...extraProviders] });
  const fixture = TestBed.createComponent(HostCmp);
  await settle(fixture);
  const paginate = fixture.debugElement
    .query(By.directive(CngxPaginator))
    .injector.get(CngxPaginate);
  return { fixture, host: fixture.componentInstance, paginate };
}

describe('CngxPaginatorStatus', () => {
  test('renders the EN-default "Page n of m" for the current page', async () => {
    const { fixture } = await setup();
    expect(statusText(fixture)).toBe('Page 1 of 10');
  });

  test('the readout follows the active page (derived, not stored)', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(4);
    await settle(fixture);
    expect(statusText(fixture)).toBe('Page 5 of 10');
  });

  test('a total-shrink clamp moves the readout with the effective page', async () => {
    const { fixture, host, paginate } = await setup();
    paginate.setPage(6);
    await settle(fixture);
    expect(statusText(fixture)).toBe('Page 7 of 10');

    host.total.set(20); // 2 pages; page clamps 6 -> 1
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(1);
    expect(statusText(fixture)).toBe('Page 2 of 2');
  });

  test('withPaginatorPageStatusFormat localises the readout', async () => {
    const { fixture } = await setup([
      provideCngxPaginatorConfig(
        withPaginatorPageStatusFormat((page, totalPages) => `Seite ${page} von ${totalPages}`),
      ),
    ]);
    expect(statusText(fixture)).toBe('Seite 1 von 10');
  });
});
