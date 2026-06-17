import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate } from '@cngx/common/data';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorPages } from './paginator-pages.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorPages],
  template: `
    <cngx-paginator [total]="total()" [pageIndex]="index()" (pageIndexChange)="index.set($event)">
      <cngx-pgn-pages />
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
  return {
    fixture,
    paginate: fixture.debugElement.query(By.directive(CngxPaginator)).injector.get(CngxPaginate),
  };
}

function pageButtons(fixture: Plumbing['fixture']): HTMLButtonElement[] {
  const root = fixture.nativeElement as HTMLElement;
  return Array.from(root.querySelectorAll<HTMLButtonElement>('.cngx-paginator__page'));
}

describe('CngxPaginatorPages', () => {
  test('the roving row is one tab stop and marks the current page', async () => {
    const { fixture } = await setup();
    const current = pageButtons(fixture).filter((b) => b.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].textContent?.trim()).toBe('1');
  });

  test('aria-current follows the active page', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(3);
    await settle(fixture);
    const current = pageButtons(fixture).find((b) => b.getAttribute('aria-current') === 'page');
    expect(current?.textContent?.trim()).toBe('4');
  });

  test('each page button carries the EN page aria-label', async () => {
    const { fixture } = await setup();
    const first = pageButtons(fixture)[0];
    expect(first.getAttribute('aria-label')).toBe('Page 1');
  });

  test('clicking a page button navigates through the brain', async () => {
    const { fixture, paginate } = await setup();
    const target = pageButtons(fixture).find((b) => b.textContent?.trim() === '3');
    target?.click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(2);
  });

  test('a truncation gap renders an ellipsis menu trigger', async () => {
    const { fixture } = await setup();
    // 10 pages, current 0 -> one trailing gap -> one ellipsis trigger.
    const more = fixture.nativeElement.querySelectorAll('.cngx-paginator__more');
    expect(more).toHaveLength(1);
    expect(more[0].getAttribute('aria-label')).toBe('More pages');
    expect(more[0].textContent?.trim()).toBe('…');
  });

  test('no ellipsis when every page fits', async () => {
    const { fixture } = await setup();
    fixture.componentInstance.total.set(50); // 5 pages
    await settle(fixture);
    expect(fixture.nativeElement.querySelectorAll('.cngx-paginator__more')).toHaveLength(0);
    expect(pageButtons(fixture)).toHaveLength(5);
  });
});
