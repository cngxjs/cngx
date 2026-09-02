import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorGoto } from './paginator-goto.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorGoto],
  template: `
    <cngx-paginator
      [total]="total()"
      [state]="state()"
      [pageIndex]="index()"
      (pageIndexChange)="index.set($event)"
    >
      <cngx-pgn-goto />
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

function gotoInput(fixture: Plumbing['fixture']): HTMLInputElement {
  return fixture.debugElement.query(By.css('.cngx-paginator__goto-input'))
    .nativeElement as HTMLInputElement;
}

describe('CngxPaginatorGoto', () => {
  test('carries the EN go-to aria-label and reflects the current 1-based page', async () => {
    const { fixture, paginate } = await setup();
    const input = gotoInput(fixture);
    expect(input.getAttribute('aria-label')).toBe('Go to page');
    expect(input.value).toBe('1');

    paginate.setPage(4);
    await settle(fixture);
    expect(input.value).toBe('5');
  });

  test('Enter navigates to the typed page through the brain', async () => {
    const { fixture, paginate } = await setup();
    const input = gotoInput(fixture);
    input.value = '4';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(3);
  });

  test('blur navigates and clamps an over-range entry to the last page', async () => {
    const { fixture, paginate } = await setup();
    const input = gotoInput(fixture);
    input.value = '999';
    input.dispatchEvent(new Event('blur'));
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(9);
    expect(input.value).toBe('10');
  });

  test('a sub-1 entry is rejected and the field re-syncs to the current page', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(2);
    await settle(fixture);
    const input = gotoInput(fixture);
    input.value = '0';
    input.dispatchEvent(new Event('blur'));
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(2);
    expect(input.value).toBe('3');
  });

  test('typing alone never navigates - navigation is commit-only', async () => {
    const { fixture, paginate } = await setup();
    const input = gotoInput(fixture);
    // First digit of a multi-digit entry: navigating here would flip an async
    // brain busy and swallow the rest of the entry.
    input.value = '2';
    input.dispatchEvent(new InputEvent('input'));
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(0);

    input.value = '25';
    input.dispatchEvent(new InputEvent('input'));
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(0);
  });

  test('a multi-digit entry commits as one navigation', async () => {
    const { fixture, host, paginate } = await setup();
    host.total.set(300); // 30 pages
    await settle(fixture);

    const input = gotoInput(fixture);
    input.value = '2';
    input.dispatchEvent(new InputEvent('input'));
    input.value = '25';
    input.dispatchEvent(new InputEvent('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(24);
  });

  test('does not navigate while the bound state is busy', async () => {
    const { fixture, host, paginate } = await setup();
    paginate.setPage(2);
    await settle(fixture);

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    const input = gotoInput(fixture);
    input.value = '7';
    input.dispatchEvent(new Event('blur'));
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(2);
  });

  test('a busy commit keeps the typed value instead of stomping the field', async () => {
    const { fixture, host, paginate } = await setup();
    paginate.setPage(2);
    await settle(fixture);

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    // The commit no-ops on the busy gate; re-syncing the field now would
    // destroy the entry the user still means to submit after the settle.
    const input = gotoInput(fixture);
    input.value = '7';
    input.dispatchEvent(new Event('blur'));
    await settle(fixture);
    expect(input.value).toBe('7');

    // Settle: the retry commits and the field re-syncs to the landed page.
    busy.set('success');
    await settle(fixture);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(6);
    expect(input.value).toBe('7');
  });
});
