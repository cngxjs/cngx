import {
  Component,
  Directive,
  inject,
  provideZonelessChangeDetection,
  signal,
  TemplateRef,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxPaginate, createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import {
  CngxPaginator,
  type CngxPaginatorDensity,
  type CngxPaginatorSkin,
} from './paginator.component';
import {
  CNGX_PAGINATOR_CONFIG,
  provideCngxPaginatorConfig,
  withPaginatorTemplates,
} from './paginator-config';
import { CNGX_PAGINATOR_HOST, type CngxPaginatorHost } from './paginator-host.token';
import { CngxPaginatorLoading } from './paginator-loading.directive';

/** Probe that a projected segment resolves the host token (regular `providers`). */
@Directive({ selector: '[probeHost]', standalone: true })
class ProbeHost {
  readonly host: CngxPaginatorHost = inject(CNGX_PAGINATOR_HOST);
}

@Component({
  standalone: true,
  imports: [CngxPaginator, ProbeHost],
  template: `
    <cngx-paginator
      [total]="total()"
      [state]="state()"
      [pageIndex]="index()"
      (pageIndexChange)="onIndex($event)"
      [pageSize]="size()"
      (pageSizeChange)="onSize($event)"
      [aria-label]="ariaLabel()"
      [skin]="skin()"
      [density]="density()"
    >
      <span probeHost></span>
    </cngx-paginator>
  `,
})
class HostCmp {
  readonly total = signal(100);
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  readonly index = signal<number | undefined>(undefined);
  readonly size = signal<number | undefined>(undefined);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly skin = signal<CngxPaginatorSkin>('numbered');
  readonly density = signal<CngxPaginatorDensity>('default');

  readonly indexEmits: number[] = [];
  readonly sizeEmits: number[] = [];

  onIndex(value: number): void {
    this.indexEmits.push(value);
    this.index.set(value);
  }
  onSize(value: number): void {
    this.sizeEmits.push(value);
    this.size.set(value);
  }
}

const providers = [provideZonelessChangeDetection()];

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  host: HostCmp;
  paginate: CngxPaginate;
  probe: ProbeHost;
  paginatorEl: HTMLElement;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
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
  const probeDe = fixture.debugElement.query(By.directive(ProbeHost));
  return {
    fixture,
    host: fixture.componentInstance,
    paginate: paginatorDe.injector.get(CngxPaginate),
    probe: probeDe.injector.get(ProbeHost),
    paginatorEl: paginatorDe.nativeElement as HTMLElement,
  };
}

describe('CngxPaginator', () => {
  test('renders the navigation landmark with the EN-default aria-label', async () => {
    const { paginatorEl } = await setup();
    expect(paginatorEl.getAttribute('role')).toBe('navigation');
    expect(paginatorEl.getAttribute('aria-label')).toBe('Pagination');
    expect(paginatorEl.getAttribute('data-skin')).toBe('numbered');
    expect(paginatorEl.getAttribute('data-density')).toBe('default');
  });

  test('[skin] and [density] reflect onto [data-skin] / [data-density]', async () => {
    const { fixture, host, paginatorEl } = await setup();
    host.skin.set('pill');
    host.density.set('compact');
    await settle(fixture);
    expect(paginatorEl.getAttribute('data-skin')).toBe('pill');
    expect(paginatorEl.getAttribute('data-density')).toBe('compact');

    host.skin.set('segmented');
    host.density.set('comfortable');
    await settle(fixture);
    expect(paginatorEl.getAttribute('data-skin')).toBe('segmented');
    expect(paginatorEl.getAttribute('data-density')).toBe('comfortable');

    for (const skin of ['rail', 'bar'] as const) {
      host.skin.set(skin);
      await settle(fixture);
      expect(paginatorEl.getAttribute('data-skin')).toBe(skin);
    }
  });

  test('aria-label input overrides the config default', async () => {
    const { fixture, host, paginatorEl } = await setup();
    host.ariaLabel.set('Seitennavigation');
    await settle(fixture);
    expect(paginatorEl.getAttribute('aria-label')).toBe('Seitennavigation');
  });

  test('a projected segment resolves CNGX_PAGINATOR_HOST to the brain', async () => {
    const { probe, paginate } = await setup();
    expect(probe.host).toBe(paginate);
    expect(probe.host.pageIndex()).toBe(0);
    expect(probe.host.totalPages()).toBe(10);
  });

  test('navigation round-trips through the brain and emits once per step', async () => {
    const { fixture, host, paginate } = await setup();

    // Uncontrolled-to-controlled: the consumer's handler sets the signal,
    // switching the binding to controlled on the first emit.
    paginate.setPage(2);
    await settle(fixture);
    expect(host.indexEmits).toEqual([2]);
    expect(host.index()).toBe(2);
    expect(paginate.pageIndex()).toBe(2);

    // Controlled nav: pageIndex() is pinned to the input until the consumer
    // feeds it back; the forwarded pageChange is the only signal that reports
    // it, and it fires exactly once (no double-emit).
    paginate.setPage(3);
    await settle(fixture);
    expect(host.indexEmits).toEqual([2, 3]);
    expect(host.index()).toBe(3);
    expect(paginate.pageIndex()).toBe(3);
  });

  test('a total-shrink clamp echoes pageIndexChange with the clamped value', async () => {
    const { fixture, host, paginate } = await setup();

    paginate.setPage(5);
    await settle(fixture);
    expect(host.index()).toBe(5);
    expect(host.indexEmits).toEqual([5]);

    // total 100 -> 20 shrinks to 2 pages; the effective page clamps 5 -> 1.
    // The brain's nav-only pageChange does NOT fire here, so the clamp effect
    // must echo the clamped value exactly once (Pillar 2: not silent).
    host.total.set(20);
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(1);
    expect(host.index()).toBe(1);
    expect(host.indexEmits).toEqual([5, 1]);
  });

  test('changing page size emits pageSizeChange and resets the page', async () => {
    const { fixture, host, paginate } = await setup();

    paginate.setPage(4);
    await settle(fixture);
    host.indexEmits.length = 0;

    paginate.setPageSize(25);
    await settle(fixture);
    expect(host.sizeEmits).toEqual([25]);
    expect(host.size()).toBe(25);
    expect(paginate.pageSize()).toBe(25);
    // setPageSize resets to page 0 and the index echoes once.
    expect(host.indexEmits).toEqual([0]);
    expect(paginate.pageIndex()).toBe(0);
  });

  test('navigation is a no-op while [state] is busy, and aria-busy reflects it', async () => {
    const { fixture, host, paginate, paginatorEl } = await setup();
    expect(paginatorEl.getAttribute('aria-busy')).toBe('false');

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);
    expect(paginatorEl.getAttribute('aria-busy')).toBe('true');

    paginate.setPage(3);
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(0);
    expect(host.indexEmits).toEqual([]);
  });

  test('renders an indeterminate cngx-progress only while [state] is busy', async () => {
    const { fixture, host, paginatorEl } = await setup();
    expect(paginatorEl.querySelector('cngx-progress')).toBeNull();

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);

    const progress = paginatorEl.querySelector('cngx-progress');
    expect(progress).not.toBeNull();
    expect(progress?.getAttribute('role')).toBe('progressbar');
    // Indeterminate: no value attributes (AT uses their absence to tell modes apart).
    expect(progress?.getAttribute('aria-valuenow')).toBeNull();
    expect(progress?.classList.contains('cngx-progress--indeterminate')).toBe(true);

    busy.set('success');
    await settle(fixture);
    expect(paginatorEl.querySelector('cngx-progress')).toBeNull();
  });

  test('the live region announces page changes, the clamp, and async transitions', async () => {
    const { fixture, host, paginate, paginatorEl } = await setup();
    const live = paginatorEl.querySelector('[aria-live]');
    expect(live).not.toBeNull();
    expect(live?.getAttribute('role')).toBe('status');
    // Initial content is the current page (not spoken until the first mutation).
    expect(live?.textContent?.trim()).toBe('Page 1 of 10');

    paginate.setPage(2);
    await settle(fixture);
    expect(live?.textContent?.trim()).toBe('Page 3 of 10');

    // total 100 -> 20 clamps the effective page 2 -> 1; the announcement follows
    // the effective page, so the clamp is not silent.
    host.total.set(20);
    await settle(fixture);
    expect(paginate.pageIndex()).toBe(1);
    expect(live?.textContent?.trim()).toBe('Page 2 of 2');

    const busy = createManualState<unknown>();
    busy.set('loading');
    host.state.set(busy);
    await settle(fixture);
    expect(live?.textContent?.trim()).toBe('Loading');

    busy.set('success');
    await settle(fixture);
    expect(live?.textContent?.trim()).toBe('Updated');
  });

  test('the live region does not re-announce when the source tuple is unchanged', async () => {
    const { fixture, host, paginate, paginatorEl } = await setup();
    const live = paginatorEl.querySelector('[aria-live]');

    paginate.setPage(2);
    await settle(fixture);
    expect(live?.textContent?.trim()).toBe('Page 3 of 10');

    // total 100 -> 99 keeps totalPages at 10 and the page at 3, so the
    // announcer source tuple {page,totalPages,busy} is identical and the
    // message must not churn (source equal fn dedupes the recompute).
    host.total.set(99);
    await settle(fixture);
    expect(paginate.totalPages()).toBe(10);
    expect(live?.textContent?.trim()).toBe('Page 3 of 10');
  });
});

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorLoading],
  template: `
    <cngx-paginator [total]="100" [state]="state()">
      <div *cngxPaginatorLoading data-test="custom-loading">Custom indicator</div>
    </cngx-paginator>
  `,
})
class SlotHostCmp {
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
}

/**
 * The paginator skin styles live inside `@layer cngx.tokens` / `@layer
 * cngx.components` and `@scope` blocks, which this runner's `getComputedStyle`
 * (jsdom) does not resolve - so the cascade cannot be read off the live element
 * here. These assertions instead verify the compiled declarations the build
 * injects: the exact values the prototype pass locks - host font `0.875rem`
 * (`0.8125rem` compact), and the host row gap `0.75rem` split from the
 * `0.25rem` inter-page gap.
 */
describe('CngxPaginator — host typography', () => {
  function paginatorCss(): string {
    return Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .filter((t) => t.includes('cngx-paginator'))
      .join('\n');
  }

  test('registers the font-size + row-gap tokens with the prototype defaults', async () => {
    await setup();
    const css = paginatorCss();
    expect(css).toMatch(/--cngx-paginator-font-size\s*\{[^}]*initial-value:\s*0\.875rem/);
    expect(css).toMatch(/--cngx-paginator-row-gap\s*\{[^}]*initial-value:\s*0\.75rem/);
  });

  test('host sets the system font + font-size and reads the row gap; the page row keeps the inter-page gap', async () => {
    await setup();
    const css = paginatorCss();
    expect(css).toMatch(/\.cngx-paginator\s*\{[^}]*font-family:[^}]*system-ui/);
    expect(css).toMatch(
      /\.cngx-paginator\s*\{[^}]*font-size:\s*var\(--cngx-paginator-font-size,\s*0\.875rem\)/,
    );
    // Host gap reads the row-gap token (0.75rem), not the page gap.
    expect(css).toMatch(
      /\.cngx-paginator\s*\{[^}]*gap:\s*var\(--cngx-paginator-row-gap,\s*0\.75rem\)/,
    );
    // The page row keeps the tight inter-page gap (0.25rem).
    expect(css).toMatch(
      /\.cngx-paginator__pages\s*\{[^}]*gap:\s*var\(--cngx-paginator-gap,\s*0\.25rem\)/,
    );
  });

  test('compact density shifts the font to 0.8125rem and shrinks the hit target to 1.75rem', async () => {
    await setup();
    const css = paginatorCss();
    expect(css).toMatch(
      /\[data-density=['"]?compact['"]?\][^{]*\{[^}]*--cngx-paginator-button-size:\s*1\.75rem/,
    );
    expect(css).toMatch(
      /\[data-density=['"]?compact['"]?\][^{]*\{[^}]*font-size:\s*var\(--cngx-paginator-font-size-compact,\s*0\.8125rem\)/,
    );
    expect(css).toMatch(
      /\[data-density=['"]?comfortable['"]?\][^{]*\{[^}]*font-size:\s*var\(--cngx-paginator-font-size-comfortable,\s*0\.95rem\)/,
    );
  });

  // Guards the default radius so a later token-default override does not silently
  // regress it back below the prototype's 0.5rem.
  test('registers the default button radius at the prototype 0.5rem', async () => {
    await setup();
    const css = paginatorCss();
    expect(css).toMatch(/--cngx-paginator-button-radius\s*\{[^}]*initial-value:\s*0\.5rem/);
  });
});

describe('CngxPaginator — loading slot', () => {
  test('a *cngxPaginatorLoading override renders the consumer template instead of the default bar', async () => {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(SlotHostCmp);
    await settle(fixture);
    const paginatorEl = fixture.debugElement.query(By.directive(CngxPaginator))
      .nativeElement as HTMLElement;

    // Idle: neither the default bar nor the consumer slot renders.
    expect(paginatorEl.querySelector('cngx-progress')).toBeNull();
    expect(paginatorEl.querySelector('[data-test="custom-loading"]')).toBeNull();

    const busy = createManualState<unknown>();
    busy.set('loading');
    fixture.componentInstance.state.set(busy);
    await settle(fixture);

    // Busy: the consumer template renders, the built-in bar is suppressed.
    expect(paginatorEl.querySelector('[data-test="custom-loading"]')).not.toBeNull();
    expect(paginatorEl.querySelector('cngx-progress')).toBeNull();

    busy.set('success');
    await settle(fixture);
    // Settled: the consumer template is gone again.
    expect(paginatorEl.querySelector('[data-test="custom-loading"]')).toBeNull();
    expect(paginatorEl.querySelector('cngx-progress')).toBeNull();
  });

  test('withPaginatorTemplates feeds the loading slot through the config cascade', () => {
    const loading = {} as TemplateRef<unknown>;
    TestBed.configureTestingModule({
      providers: [...providers, provideCngxPaginatorConfig(withPaginatorTemplates({ loading }))],
    });
    expect(TestBed.inject(CNGX_PAGINATOR_CONFIG).templates?.loading).toBe(loading);
  });
});
