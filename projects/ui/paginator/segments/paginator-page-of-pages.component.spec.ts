import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorPageOfPages } from './paginator-page-of-pages.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorPageOfPages],
  template: `
    <cngx-paginator [total]="total()" [state]="state()">
      <cngx-pgn-page-of-pages />
    </cngx-paginator>
  `,
})
class HostCmp {
  readonly total = signal(100); // 10 pages of 10
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

function trigger(fixture: Plumbing['fixture']): HTMLButtonElement {
  return fixture.debugElement.query(By.css('.cngx-paginator__select'))
    .nativeElement as HTMLButtonElement;
}

function label(fixture: Plumbing['fixture']): string {
  return (
    fixture.nativeElement.querySelector('.cngx-paginator__select-label')?.textContent?.trim() ?? ''
  );
}

function options(fixture: Plumbing['fixture']): HTMLElement[] {
  const root = fixture.nativeElement as HTMLElement;
  return Array.from(root.querySelectorAll<HTMLElement>('.cngx-paginator__option'));
}

describe('CngxPaginatorPageOfPages', () => {
  test('the trigger shows current/total and carries the EN aria-label', async () => {
    const { fixture } = await setup();
    expect(trigger(fixture).getAttribute('aria-label')).toBe('Select page');
    expect(label(fixture)).toBe('1 / 10');
  });

  test('the option list tracks totalPages()', async () => {
    const { fixture, host } = await setup();
    expect(options(fixture)).toHaveLength(10);

    host.total.set(50); // 5 pages
    await settle(fixture);
    expect(options(fixture).map((o) => o.textContent?.trim())).toEqual(['1', '2', '3', '4', '5']);
  });

  test('selecting page n calls host.setPage(n - 1) and reflects the new active page', async () => {
    const { fixture, paginate } = await setup();
    // Activate the option directly: opening the popover belongs to CngxPopover
    // (jsdom has no native showPopover); this segment owns the activation wiring.
    options(fixture)
      .find((o) => o.textContent?.trim() === '4')
      ?.click();
    await settle(fixture);

    expect(paginate.pageIndex()).toBe(3);
    expect(label(fixture)).toBe('4 / 10');
  });

  test('the option for the active page is aria-selected', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(2);
    await settle(fixture);
    const selected = options(fixture).filter((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected.map((o) => o.textContent?.trim())).toEqual(['3']);
  });

  test('disables the trigger and does not navigate while busy', async () => {
    const { fixture, host, paginate } = await setup();
    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    expect(trigger(fixture).disabled).toBe(true);
    options(fixture)
      .find((o) => o.textContent?.trim() === '4')
      ?.click();
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(0);
  });
});
