import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorPageSize } from './paginator-page-size.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorPageSize],
  template: `
    <cngx-paginator [total]="total()" [state]="state()">
      <cngx-pgn-page-size [options]="sizes" />
    </cngx-paginator>
  `,
})
class HostCmp {
  readonly total = signal(100);
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  readonly sizes = [10, 20, 50] as const;
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

function options(fixture: Plumbing['fixture']): HTMLElement[] {
  const root = fixture.nativeElement as HTMLElement;
  return Array.from(root.querySelectorAll<HTMLElement>('.cngx-paginator__option'));
}

async function pick(fixture: Plumbing['fixture'], size: string): Promise<void> {
  // Drive the option activation directly; the popover open/close belongs to
  // CngxPopover (and jsdom has no native showPopover). What this segment owns
  // is the activation -> host wiring.
  options(fixture)
    .find((o) => o.textContent?.trim() === size)
    ?.click();
  await settle(fixture);
}

describe('CngxPaginatorPageSize', () => {
  test('the trigger shows the current size and carries the EN aria-label', async () => {
    const { fixture } = await setup();
    expect(trigger(fixture).getAttribute('aria-label')).toBe('Items per page');
    expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('listbox');
    expect(
      fixture.nativeElement.querySelector('.cngx-paginator__select-label').textContent?.trim(),
    ).toBe('10');
  });

  test('renders one option per provided size with the listbox aria role wired', async () => {
    const { fixture } = await setup();
    const panel = fixture.nativeElement.querySelector('.cngx-paginator__select-panel');
    expect(panel.getAttribute('role')).toBe('listbox');
    expect(panel.getAttribute('aria-label')).toBe('Items per page');
    expect(options(fixture).map((o) => o.textContent?.trim())).toEqual(['10', '20', '50']);
  });

  test('the option matching the current size is aria-selected', async () => {
    const { fixture } = await setup();
    const selected = options(fixture).filter((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected.map((o) => o.textContent?.trim())).toEqual(['10']);
  });

  test('selecting a size changes the page size and resets to page 0', async () => {
    const { fixture, paginate } = await setup();
    paginate.setPage(3);
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(3);

    await pick(fixture, '20');

    expect(paginate.pageSize()).toBe(20);
    expect(paginate.pageIndex()).toBe(0);
  });

  test('disables the trigger and does not change the size while busy', async () => {
    const { fixture, host, paginate } = await setup();
    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    // Native disabled gates both pointer and keyboard open, so the panel is
    // unreachable while busy; the brain also no-ops the write as a backstop.
    expect(trigger(fixture).disabled).toBe(true);
    await pick(fixture, '50');
    expect(paginate.pageSize()).toBe(10);
  });
});
