import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, test } from 'vitest';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxPaginate } from './paginate.directive';
import { CngxPaginateRouting } from './paginate-routing.directive';

@Component({
  standalone: true,
  imports: [CngxPaginate, CngxPaginateRouting],
  template: `<div cngxPaginate cngxPaginateRouting [total]="100"></div>`,
})
class RoutedHost {}

function brainOf(harness: RouterTestingHarness): CngxPaginate {
  return harness.fixture.debugElement.query(By.directive(CngxPaginate)).injector.get(CngxPaginate);
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  harness.detectChanges();
  await harness.fixture.whenStable();
  harness.detectChanges();
  await harness.fixture.whenStable();
}

describe('CngxPaginateRouting', () => {
  test('URL -> brain: a deep-linked ?page / ?pageSize lands on the brain', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'list', component: RoutedHost }]),
      ],
    });

    const harness = await RouterTestingHarness.create('/list?page=3&pageSize=25');
    await settle(harness);

    const brain = brainOf(harness);
    // page is 1-based in the URL, 0-based on the brain.
    expect(brain.pageIndex()).toBe(2);
    expect(brain.pageSize()).toBe(25);
  });

  test('brain -> URL: navigating the brain writes the 1-based page into the query string', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'list', component: RoutedHost }]),
      ],
    });

    const harness = await RouterTestingHarness.create('/list');
    await settle(harness);

    brainOf(harness).setPage(4);
    await settle(harness);

    expect(TestBed.inject(Router).url).toContain('page=5');
  });

  test('deep link survives a total that arrives async', async () => {
    @Component({
      standalone: true,
      imports: [CngxPaginate, CngxPaginateRouting],
      template: `<div cngxPaginate cngxPaginateRouting [total]="total()"></div>`,
    })
    class LateTotalHost {
      readonly total = signal(0);
    }

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'list', component: LateTotalHost }]),
      ],
    });

    const harness = await RouterTestingHarness.create('/list?page=5&pageSize=10');
    await settle(harness);

    // total has not landed: the brain clamps to page 0, but the URL keeps the deep link.
    const brain = brainOf(harness);
    expect(brain.pageIndex()).toBe(0);
    expect(TestBed.inject(Router).url).toContain('page=5');

    const host = harness.fixture.debugElement.query(By.directive(CngxPaginate))
      .componentInstance as LateTotalHost;
    host.total.set(100);
    await settle(harness);

    // total landed: the parked index is re-applied and the URL still matches.
    expect(brain.pageIndex()).toBe(4);
    expect(TestBed.inject(Router).url).toContain('page=5');
  });

  test('deep link parked while the bound async state is busy lands on release', async () => {
    const busy = signal(true);
    const fakeState = { isBusy: () => busy() } as unknown as CngxAsyncState<unknown>;

    @Component({
      standalone: true,
      imports: [CngxPaginate, CngxPaginateRouting],
      template: `<div cngxPaginate cngxPaginateRouting [total]="100" [state]="state"></div>`,
    })
    class BusyHost {
      readonly state = fakeState;
    }

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'list', component: BusyHost }]),
      ],
    });

    const harness = await RouterTestingHarness.create('/list?page=3&pageSize=25');
    await settle(harness);

    const brain = brainOf(harness);
    // Busy: both setters no-op, the URL request is parked, the URL untouched.
    expect(brain.pageIndex()).toBe(0);
    expect(brain.pageSize()).toBe(10);
    expect(TestBed.inject(Router).url).toContain('page=3');

    busy.set(false);
    await settle(harness);

    expect(brain.pageIndex()).toBe(2);
    expect(brain.pageSize()).toBe(25);
    expect(TestBed.inject(Router).url).toContain('page=3');
  });

  test('a user navigation supersedes a parked deep link', async () => {
    @Component({
      standalone: true,
      imports: [CngxPaginate, CngxPaginateRouting],
      template: `<div cngxPaginate cngxPaginateRouting [total]="total()"></div>`,
    })
    class LateTotalHost {
      readonly total = signal(0);
    }

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'list', component: LateTotalHost }]),
      ],
    });

    const harness = await RouterTestingHarness.create('/list?page=5');
    await settle(harness);

    const brain = brainOf(harness);
    brain.setPage(0);
    await settle(harness);

    const host = harness.fixture.debugElement.query(By.directive(CngxPaginate))
      .componentInstance as LateTotalHost;
    host.total.set(100);
    await settle(harness);

    // The parked page=5 was discarded by the user click; the URL follows the brain.
    expect(brain.pageIndex()).toBe(0);
    expect(TestBed.inject(Router).url).toContain('page=1');
  });

  test('an out-of-range deep link is clamped once the real total is known', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'list', component: RoutedHost }]),
      ],
    });

    // RoutedHost binds total=100 statically: 10 pages, page=99 is out of range.
    const harness = await RouterTestingHarness.create('/list?page=99');
    await settle(harness);

    const brain = brainOf(harness);
    expect(brain.pageIndex()).toBe(9);
    expect(TestBed.inject(Router).url).toContain('page=10');
  });

  test('custom param names are honoured', async () => {
    @Component({
      standalone: true,
      imports: [CngxPaginate, CngxPaginateRouting],
      template: `<div
        cngxPaginate
        cngxPaginateRouting
        cngxPaginatePageParam="p"
        cngxPaginateSizeParam="ps"
        [total]="100"
      ></div>`,
    })
    class CustomHost {}

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'list', component: CustomHost }]),
      ],
    });

    const harness = await RouterTestingHarness.create('/list?p=2');
    await settle(harness);

    expect(brainOf(harness).pageIndex()).toBe(1);
  });
});
