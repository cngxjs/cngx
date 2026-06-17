import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxMatPaginator } from './mat-paginator-bridge.directive';

@Component({
  standalone: true,
  imports: [MatPaginatorModule, CngxMatPaginator],
  template: `
    <mat-paginator
      cngxMatPaginator
      [total]="total()"
      [state]="state()"
      [cngxPageIndex]="controlledIndex()"
      [cngxPageSize]="controlledSize()"
      [pageSizeOptions]="options()"
    />
  `,
})
class HostCmp {
  readonly total = signal(100);
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  readonly controlledIndex = signal<number | undefined>(undefined);
  readonly controlledSize = signal<number | undefined>(undefined);
  readonly options = signal<number[]>([5, 10, 25]);
}

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  matPaginator: MatPaginator;
  paginate: CngxPaginate;
  host: HostCmp;
}

const providers = [provideZonelessChangeDetection()];

function isDisabled(button: Element | null): boolean {
  // disabledInteractive keeps the nav buttons focusable, so Material marks
  // them via aria-disabled rather than the native disabled attribute; cover
  // both so the assertion does not hinge on that rendering choice.
  return button?.getAttribute('aria-disabled') === 'true' || button?.hasAttribute('disabled') === true;
}

async function setup(): Promise<Plumbing> {
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  const matEl = fixture.debugElement.query((el) => el.componentInstance instanceof MatPaginator);
  return {
    fixture,
    matPaginator: matEl.componentInstance as MatPaginator,
    paginate: matEl.injector.get(CngxPaginate),
    host: fixture.componentInstance,
  };
}

async function settle(fixture: Plumbing['fixture']): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

describe('CngxMatPaginator (bridge)', () => {
  test('(a) brain index/size/total write through to the rendered paginator', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, paginate } = await setup();

    paginate.setPage(1);
    await settle(fixture);

    expect(matPaginator.pageIndex).toBe(1);
    expect(matPaginator.length).toBe(100);
    expect(matPaginator.pageSize).toBe(10);

    const rangeLabel = fixture.nativeElement.querySelector('.mat-mdc-paginator-range-label');
    const text = rangeLabel?.textContent ?? '';
    expect(text).toContain('11');
    expect(text).toContain('20');
    expect(text).toContain('100');
  });

  test('(b) Material (page) emit forwards into the brain and fires both outputs', async () => {
    TestBed.configureTestingModule({ providers });
    const { matPaginator, paginate } = await setup();

    let pageChange: number | undefined;
    let pageSizeChange: number | undefined;
    paginate.pageChange.subscribe((v) => (pageChange = v));
    paginate.pageSizeChange.subscribe((v) => (pageSizeChange = v));

    matPaginator.page.emit({ previousPageIndex: 0, pageIndex: 2, pageSize: 25, length: 100 });

    expect(paginate.pageIndex()).toBe(2);
    expect(paginate.pageSize()).toBe(25);
    expect(pageSizeChange).toBe(25);
    expect(pageChange).toBe(2);
  });

  test('(c) disabled-only flip re-renders the nav buttons with page and total unchanged', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, host } = await setup();

    const nextButton = () => fixture.nativeElement.querySelector('.mat-mdc-paginator-navigation-next');
    expect(matPaginator.pageIndex).toBe(0);
    expect(isDisabled(nextButton())).toBe(false);

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    expect(matPaginator.pageIndex).toBe(0);
    expect(matPaginator.disabled).toBe(true);
    expect(isDisabled(nextButton())).toBe(true);
  });

  test('(d) the busy brain drops a forwarded (page) emit', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, paginate, host } = await setup();

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    matPaginator.page.emit({ previousPageIndex: 0, pageIndex: 3, pageSize: 10, length: 100 });

    expect(paginate.pageIndex()).toBe(0);
  });

  test('(e) controlled cngxPageIndex wins over internal state', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, paginate, host } = await setup();

    host.controlledIndex.set(3);
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(3);
    expect(matPaginator.pageIndex).toBe(3);

    paginate.setPage(5);
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(3);
    expect(matPaginator.pageIndex).toBe(3);
  });

  test('(f) pageSizeOptions input reaches the rendered page-size selector', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, host } = await setup();

    host.options.set([5, 15, 30]);
    await settle(fixture);

    expect(matPaginator.pageSizeOptions).toEqual([5, 15, 30]);
    const select = fixture.nativeElement.querySelector('.mat-mdc-paginator-page-size-select');
    expect(select).not.toBeNull();
  });

  test('(g) controlled cngxPageSize wins over a Material (page) size change', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, paginate, host } = await setup();

    host.controlledSize.set(25);
    await settle(fixture);
    expect(paginate.pageSize()).toBe(25);

    matPaginator.page.emit({ previousPageIndex: 0, pageIndex: 0, pageSize: 5, length: 100 });
    expect(paginate.pageSize()).toBe(25);
  });

  test('(h) page-size selector paints the active size even when options exclude it', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, host } = await setup();

    host.options.set([5, 25]);
    await settle(fixture);

    const matSelectEl = fixture.debugElement.query((el) => el.componentInstance instanceof MatSelect);
    const matSelect = matSelectEl.componentInstance as MatSelect;
    expect(matSelect.value).toBe(10);
    expect(matSelect.empty).toBe(false);
  });
});
