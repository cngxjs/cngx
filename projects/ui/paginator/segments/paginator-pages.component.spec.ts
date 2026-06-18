import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate } from '@cngx/common/data';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorPages } from './paginator-pages.component';
import { CNGX_PAGINATOR_PAGE_WINDOW_FACTORY } from './paginator-page-window.token';

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

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorPages],
  template: `
    <cngx-paginator [total]="100">
      <cngx-pgn-pages [siblingCount]="sibling()" [boundaryCount]="boundary()" />
    </cngx-paginator>
  `,
})
class ConfigurableHostCmp {
  readonly sibling = signal(1);
  readonly boundary = signal(1);
}

const providers = [provideZonelessChangeDetection()];

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  paginate: CngxPaginate;
}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
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

describe('CngxPaginatorPages — configurable truncation', () => {
  async function setupConfigurable(): Promise<ComponentFixture<ConfigurableHostCmp>> {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ConfigurableHostCmp);
    await settle(fixture);
    return fixture;
  }

  function pages(fixture: ComponentFixture<ConfigurableHostCmp>): HTMLButtonElement[] {
    const root = fixture.nativeElement as HTMLElement;
    return Array.from(root.querySelectorAll<HTMLButtonElement>('.cngx-paginator__page'));
  }

  test('siblingCount widens the rendered page-button count', async () => {
    const fixture = await setupConfigurable();
    const atDefault = pages(fixture).length;
    fixture.componentInstance.sibling.set(2);
    await settle(fixture);
    expect(pages(fixture).length).toBeGreaterThan(atDefault);
  });

  test('boundaryCount of 0 drops the pinned last page', async () => {
    const fixture = await setupConfigurable();
    const labels = () => pages(fixture).map((b) => b.textContent?.trim());
    expect(labels()).toContain('10'); // pinned last page at the 1 / 1 default
    fixture.componentInstance.boundary.set(0);
    await settle(fixture);
    expect(labels()).not.toContain('10');
  });

  test('a CNGX_PAGINATOR_PAGE_WINDOW_FACTORY override replaces the algorithm', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: CNGX_PAGINATOR_PAGE_WINDOW_FACTORY,
          useValue: () => () => ({
            pages: [
              { kind: 'page', index: 0 },
              { kind: 'page', index: 1 },
            ],
            gaps: 0,
          }),
        },
      ],
    });
    const fixture = TestBed.createComponent(ConfigurableHostCmp);
    await settle(fixture);
    // 10 real pages, but the override hard-codes a two-button window and no gap.
    expect(pages(fixture).map((b) => b.textContent?.trim())).toEqual(['1', '2']);
    expect(fixture.nativeElement.querySelectorAll('.cngx-paginator__more')).toHaveLength(0);
  });
});
