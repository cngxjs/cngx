import {
  Component,
  computed,
  inject,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import {
  CNGX_PAGINATOR_ANNOUNCER_FACTORY,
  createPaginatorAnnouncer,
  type CngxPaginatorAnnouncer,
} from './paginator-announcer';
import {
  CNGX_PAGINATOR_DEFAULTS,
  provideCngxPaginatorConfig,
  withPaginatorAriaLabels,
  withPaginatorRangeFormat,
} from './paginator-config';
import { CNGX_PAGINATOR_HOST } from './paginator-host.token';
import { CngxPaginator } from './paginator.component';
import { CngxPaginatorPageOfPages } from './segments/paginator-page-of-pages.component';
import { CngxPaginatorRange } from './segments/paginator-range.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorRange, CngxPaginatorPageOfPages],
  template: `
    <cngx-paginator [total]="total()">
      <cngx-pgn-range />
      <cngx-pgn-page-of-pages />
    </cngx-paginator>
  `,
})
class SegmentsHost {
  readonly total = signal(95);
}

/** An override announcer proving the derivation is swappable, not just the phrasing. */
function announceWithMarker(): CngxPaginatorAnnouncer {
  const host = inject(CNGX_PAGINATOR_HOST);
  return { message: computed(() => `custom:${host.pageIndex() + 1}`) };
}

async function settle(fixture: ReturnType<typeof TestBed.createComponent<SegmentsHost>>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

async function render(providers: unknown[] = []): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), ...(providers as [])] });
  const fixture = TestBed.createComponent(SegmentsHost);
  await settle(fixture);
  return fixture.nativeElement.querySelector('cngx-paginator') as HTMLElement;
}

describe('CNGX_PAGINATOR_ANNOUNCER_FACTORY', () => {
  test('resolves to createPaginatorAnnouncer by default', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    expect(TestBed.inject(CNGX_PAGINATOR_ANNOUNCER_FACTORY)).toBe(createPaginatorAnnouncer);
  });

  test('the default factory drives the canonical live-region phrasing', async () => {
    const paginatorEl = await render();
    const live = paginatorEl.querySelector('[aria-live]');
    expect(live?.textContent?.trim()).toBe('Page 1 of 10');
  });

  test('an override swaps the announcer derivation the shell mounts', async () => {
    const paginatorEl = await render([
      { provide: CNGX_PAGINATOR_ANNOUNCER_FACTORY, useValue: announceWithMarker },
    ]);
    const live = paginatorEl.querySelector('[aria-live]');
    expect(live?.textContent?.trim()).toBe('custom:1');
  });
});

describe('paginator config: range format + pageOfPages keys', () => {
  test('EN defaults carry the new keys', () => {
    // The default emphasises the current range with `<b>` (rendered as
    // sanitised HTML by cngx-pgn-range; its textContent stays "1-10 of 95").
    expect(CNGX_PAGINATOR_DEFAULTS.formats.range(1, 10, 95)).toBe('<b>1-10</b> of 95');
    expect(CNGX_PAGINATOR_DEFAULTS.ariaLabels.pageOfPages).toBe('Select page');
    // Distinct from the go-to-page label it used to borrow.
    expect(CNGX_PAGINATOR_DEFAULTS.ariaLabels.pageOfPages).not.toBe(
      CNGX_PAGINATOR_DEFAULTS.ariaLabels.goToPage,
    );
  });

  test('the default range format reaches cngx-pgn-range', async () => {
    const paginatorEl = await render();
    expect(paginatorEl.querySelector('.cngx-paginator__range')?.textContent?.trim()).toBe(
      '1-10 of 95',
    );
  });

  test('withPaginatorRangeFormat cascades to cngx-pgn-range', async () => {
    const paginatorEl = await render([
      provideCngxPaginatorConfig(withPaginatorRangeFormat((s, e, t) => `${s}-${e} von ${t}`)),
    ]);
    expect(paginatorEl.querySelector('.cngx-paginator__range')?.textContent?.trim()).toBe(
      '1-10 von 95',
    );
  });

  test('pageOfPages aria label cascades to cngx-pgn-page-of-pages', async () => {
    const paginatorEl = await render([
      provideCngxPaginatorConfig(withPaginatorAriaLabels({ pageOfPages: 'Seite wählen' })),
    ]);
    const trigger = paginatorEl.querySelector('.cngx-paginator__select');
    expect(trigger?.getAttribute('aria-label')).toBe('Seite wählen');
  });
});
