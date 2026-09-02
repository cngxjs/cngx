import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';
import { provideCngxPaginatorConfig, withPaginatorAnnouncements } from '@cngx/ui/paginator';

import {
  CngxMatPaginator,
  type CngxMatPaginatorAnnounceContext,
} from './mat-paginator-bridge.directive';

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
      [resetOn]="resetKey()"
      [announce]="announce()"
      (pageChange)="indexEmits.push($event)"
      (pageSizeChange)="sizeEmits.push($event)"
    />
  `,
})
class HostCmp {
  readonly total = signal(100);
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  readonly controlledIndex = signal<number | undefined>(undefined);
  readonly controlledSize = signal<number | undefined>(undefined);
  readonly options = signal<number[]>([5, 10, 25]);
  readonly resetKey = signal<string | undefined>(undefined);
  readonly announce = signal(false);
  readonly indexEmits: number[] = [];
  readonly sizeEmits: number[] = [];
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

  test('(g) controlled cngxPageSize wins, but pageSizeChange still fires so the consumer can sync', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, paginate, host } = await setup();

    host.controlledSize.set(25);
    await settle(fixture);
    expect(paginate.pageSize()).toBe(25);

    let emitted: number | undefined;
    paginate.pageSizeChange.subscribe((v) => (emitted = v));
    matPaginator.page.emit({ previousPageIndex: 0, pageIndex: 0, pageSize: 5, length: 100 });

    // pageSize() holds the controlled value until the consumer's (pageSizeChange)
    // handler writes the new size back to [cngxPageSize] - the emit is that sync
    // signal, not a stale event. Suppressing it would break controlled binding.
    expect(paginate.pageSize()).toBe(25);
    expect(emitted).toBe(5);
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

  test('(i) aria-busy on the host reflects the brain busy state', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, host } = await setup();

    const hostEl = fixture.nativeElement.querySelector('mat-paginator');
    expect(hostEl?.getAttribute('aria-busy')).toBe('false');

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);
    expect(hostEl?.getAttribute('aria-busy')).toBe('true');
  });

  test('(j) [resetOn] jumps to the first page when the key changes, not on mount', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, paginate, host } = await setup();

    paginate.setPage(3);
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(3);

    // Mount already ran the reset effect once with the initial key - the page
    // must still be where navigation left it.
    expect(paginate.pageIndex()).toBe(3);

    host.resetKey.set('filtered');
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(0);
  });

  test('(k) [announce] mounts a polite live region speaking the config page phrase', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, paginate, host } = await setup();

    host.announce.set(true);
    await settle(fixture);

    const live = fixture.nativeElement.querySelector('.cngx-mat-paginator-live') as HTMLElement | null;
    expect(live).toBeTruthy();
    // Default phrasing comes from CNGX_PAGINATOR_CONFIG announcements.pageChange
    // (EN default "Page N of M"), identical to the organism's live region.
    expect(live?.textContent).toBe('Page 1 of 10');

    paginate.setPage(1);
    await settle(fixture);
    expect(live?.textContent).toBe('Page 2 of 10');
  });

  test('(k1) withPaginatorAnnouncements localises the bridge announcement', async () => {
    TestBed.configureTestingModule({
      providers: [
        ...providers,
        provideCngxPaginatorConfig(
          withPaginatorAnnouncements({ pageChange: (page, total) => `Seite ${page} von ${total}` }),
        ),
      ],
    });
    const { fixture, host } = await setup();

    host.announce.set(true);
    await settle(fixture);
    const live = fixture.nativeElement.querySelector('.cngx-mat-paginator-live') as HTMLElement;
    expect(live.textContent).toBe('Seite 1 von 10');
  });

  test('(k3) a bound [announceLabel] overrides the config default with the range context', async () => {
    TestBed.configureTestingModule({ providers });

    @Component({
      standalone: true,
      imports: [MatPaginatorModule, CngxMatPaginator],
      template: `
        <mat-paginator
          cngxMatPaginator
          announce
          [total]="100"
          [announceLabel]="label"
        />
      `,
    })
    class LabelHost {
      readonly label = (c: CngxMatPaginatorAnnounceContext): string =>
        `p${c.page}/${c.totalPages} items ${c.start}-${c.end} of ${c.total}`;
    }

    const fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const live = fixture.nativeElement.querySelector('.cngx-mat-paginator-live') as HTMLElement;
    expect(live.textContent).toBe('p1/10 items 1-10 of 100');
  });

  test('(k2) flipping [announce] off clears the mounted live region', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, host } = await setup();

    host.announce.set(true);
    await settle(fixture);
    const live = fixture.nativeElement.querySelector('.cngx-mat-paginator-live') as HTMLElement;
    expect(live.textContent).not.toBe('');

    // The region stays mounted, but a stale last message must not linger in
    // the accessibility tree once announcements are opted out.
    host.announce.set(false);
    await settle(fixture);
    expect(live.textContent).toBe('');
  });

  test('(l) a page click emits pageChange once and no spurious pageSizeChange', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, host } = await setup();

    // Every PageEvent carries the (unchanged) pageSize and the subscription
    // calls setPageSize on each one; the shared guard must swallow the
    // unchanged size instead of forwarding the brain's unconditional emit.
    matPaginator.page.emit({ previousPageIndex: 0, pageIndex: 2, pageSize: 10, length: 100 });
    await settle(fixture);
    expect(host.indexEmits).toEqual([2]);
    expect(host.sizeEmits).toEqual([]);

    matPaginator.page.emit({ previousPageIndex: 2, pageIndex: 3, pageSize: 10, length: 100 });
    await settle(fixture);
    expect(host.indexEmits).toEqual([2, 3]);
    expect(host.sizeEmits).toEqual([]);
  });

  test('(m) a real size change emits pageSizeChange exactly once', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, matPaginator, host } = await setup();

    matPaginator.page.emit({ previousPageIndex: 0, pageIndex: 0, pageSize: 25, length: 100 });
    await settle(fixture);
    expect(host.sizeEmits).toEqual([25]);
    expect(host.indexEmits).toEqual([]);
  });

  test('(n) a total-shrink clamp reaches the bridge pageChange output', async () => {
    TestBed.configureTestingModule({ providers });
    const { fixture, paginate, host } = await setup();

    paginate.setPage(5);
    await settle(fixture);
    expect(host.indexEmits).toEqual([5]);

    // total 100 -> 20 clamps the effective page 5 -> 1 with no nav; the raw
    // brain alias missed this entirely, the clamp path must report it once.
    host.total.set(20);
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(1);
    expect(host.indexEmits).toEqual([5, 1]);
  });

  test('(o) a static announce attribute enables the live region (booleanAttribute)', async () => {
    TestBed.configureTestingModule({ providers });

    @Component({
      standalone: true,
      imports: [MatPaginatorModule, CngxMatPaginator],
      template: '<mat-paginator cngxMatPaginator announce [total]="100" />',
    })
    class StaticAnnounceHost {}

    const fixture = TestBed.createComponent(StaticAnnounceHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const live = fixture.nativeElement.querySelector('.cngx-mat-paginator-live');
    expect(live).toBeTruthy();
  });
});
