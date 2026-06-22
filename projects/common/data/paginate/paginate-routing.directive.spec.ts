import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, test } from 'vitest';

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
