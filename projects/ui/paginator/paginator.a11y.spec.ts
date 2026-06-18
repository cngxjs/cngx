import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import {
  CngxPaginatorFirst,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPrev,
} from './segments/paginator-nav.component';
import { CngxPaginatorPages } from './segments/paginator-pages.component';
import { CngxPaginator } from './paginator.component';

@Component({
  standalone: true,
  imports: [
    CngxPaginator,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorNext,
    CngxPaginatorLast,
  ],
  template: `
    <cngx-paginator [total]="total()" [state]="state()">
      <cngx-pgn-first />
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-next />
      <cngx-pgn-last />
    </cngx-paginator>
  `,
})
class HostCmp {
  // 50 items / 10 per page -> 5 pages, all rendered (no ellipsis truncation).
  readonly total = signal(50);
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
}

const providers = [provideZonelessChangeDetection()];

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  host: HostCmp;
  paginate: CngxPaginate;
  paginatorEl: HTMLElement;
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
  return {
    fixture,
    host: fixture.componentInstance,
    paginate: paginatorDe.injector.get(CngxPaginate),
    paginatorEl: paginatorDe.nativeElement as HTMLElement,
  };
}

function pageButtons(el: HTMLElement): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll<HTMLButtonElement>('.cngx-paginator__page'));
}

function navButton(el: HTMLElement, label: string): HTMLButtonElement {
  const btn = el.querySelector<HTMLButtonElement>(`.cngx-paginator__nav[aria-label="${label}"]`);
  if (!btn) {
    throw new Error(`nav button "${label}" not found`);
  }
  return btn;
}

function press(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('CngxPaginator a11y', () => {
  test('roving tabindex: only one page button is tabbable, arrows/Home/End move it', async () => {
    const { fixture, paginatorEl } = await setup();
    const pages = pageButtons(paginatorEl);
    expect(pages).toHaveLength(5);

    const tabindexes = (): string[] => pages.map((b) => b.getAttribute('tabindex') ?? '');
    // Exactly one tab stop, starting on the first page.
    expect(tabindexes()).toEqual(['0', '-1', '-1', '-1', '-1']);

    press(pages[0], 'ArrowRight');
    await settle(fixture);
    expect(tabindexes()).toEqual(['-1', '0', '-1', '-1', '-1']);

    press(pages[1], 'End');
    await settle(fixture);
    expect(tabindexes()).toEqual(['-1', '-1', '-1', '-1', '0']);

    press(pages[4], 'Home');
    await settle(fixture);
    expect(tabindexes()).toEqual(['0', '-1', '-1', '-1', '-1']);

    press(pages[0], 'ArrowLeft');
    await settle(fixture);
    // loop wraps to the last item.
    expect(tabindexes()).toEqual(['-1', '-1', '-1', '-1', '0']);
  });

  test('aria-current follows the active page', async () => {
    const { fixture, paginate, paginatorEl } = await setup();
    const pages = pageButtons(paginatorEl);
    const current = (): number => pages.findIndex((b) => b.getAttribute('aria-current') === 'page');
    expect(current()).toBe(0);
    expect(pages.filter((b) => b.getAttribute('aria-current') === 'page')).toHaveLength(1);

    pages[2].click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(2);
    expect(current()).toBe(2);
    expect(pages.filter((b) => b.getAttribute('aria-current') === 'page')).toHaveLength(1);
  });

  test('aria-busy on the landmark toggles with [state]', async () => {
    const { fixture, host, paginatorEl } = await setup();
    expect(paginatorEl.getAttribute('aria-busy')).toBe('false');

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);
    expect(paginatorEl.getAttribute('aria-busy')).toBe('true');

    busy.set('success');
    await settle(fixture);
    expect(paginatorEl.getAttribute('aria-busy')).toBe('false');
  });

  test('bound nav buttons carry aria-disabled and stay focusable', async () => {
    const { fixture, paginate, paginatorEl } = await setup();
    // On the first page: first/prev are at the bound, next/last are not.
    expect(navButton(paginatorEl, 'First page').getAttribute('aria-disabled')).toBe('true');
    expect(navButton(paginatorEl, 'Previous page').getAttribute('aria-disabled')).toBe('true');
    expect(navButton(paginatorEl, 'Next page').getAttribute('aria-disabled')).toBe('false');
    expect(navButton(paginatorEl, 'Last page').getAttribute('aria-disabled')).toBe('false');
    // aria-disabled (not native disabled) keeps the button in the AT focus order.
    expect(navButton(paginatorEl, 'First page').hasAttribute('disabled')).toBe(false);

    paginate.last();
    await settle(fixture);
    expect(navButton(paginatorEl, 'First page').getAttribute('aria-disabled')).toBe('false');
    expect(navButton(paginatorEl, 'Previous page').getAttribute('aria-disabled')).toBe('false');
    expect(navButton(paginatorEl, 'Next page').getAttribute('aria-disabled')).toBe('true');
    expect(navButton(paginatorEl, 'Last page').getAttribute('aria-disabled')).toBe('true');
  });

  test('navigation buttons are gated (aria-disabled) while busy', async () => {
    const { fixture, host, paginatorEl } = await setup();
    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);
    // Busy disables every nav button, including ones not at a bound.
    expect(navButton(paginatorEl, 'Next page').getAttribute('aria-disabled')).toBe('true');
    expect(navButton(paginatorEl, 'Last page').getAttribute('aria-disabled')).toBe('true');
  });
});
