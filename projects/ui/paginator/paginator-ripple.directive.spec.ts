import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CngxRipple } from '@cngx/common/interactive';

import { CngxPaginatorRipple } from './paginator-ripple.directive';
import { CngxPaginator } from './paginator.component';
import { CngxPaginatorLoadMore } from './segments/paginator-load-more.component';
import { CngxPaginatorNext, CngxPaginatorPrev } from './segments/paginator-nav.component';

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorPrev, CngxPaginatorNext, CngxPaginatorLoadMore],
  template: `
    <cngx-paginator [total]="100">
      <cngx-pgn-prev />
      <cngx-pgn-next />
      <cngx-pgn-load-more />
    </cngx-paginator>
  `,
})
class PlainHost {}

@Component({
  standalone: true,
  imports: [
    CngxPaginator,
    CngxPaginatorRipple,
    CngxPaginatorPrev,
    CngxPaginatorNext,
    CngxPaginatorLoadMore,
  ],
  template: `
    <cngx-paginator [total]="100" [cngxPaginatorRipple]="on()">
      <cngx-pgn-prev />
      <cngx-pgn-next />
      <cngx-pgn-load-more />
    </cngx-paginator>
  `,
})
class SwitchHost {
  readonly on = signal(true);
}

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorRipple, CngxPaginatorNext],
  template: `
    <section cngxPaginatorRipple>
      <cngx-paginator [total]="100"><cngx-pgn-next /></cngx-paginator>
    </section>
  `,
})
class AncestorHost {}

async function render<T>(cmp: new () => T) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(cmp);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function ripples(fixture: ComponentFixture<unknown>): CngxRipple[] {
  return fixture.debugElement
    .queryAll(By.directive(CngxRipple))
    .map((el) => el.injector.get(CngxRipple));
}

describe('CngxPaginatorRipple', () => {
  test('the paginator buttons do not ripple without the directive', async () => {
    const all = ripples(await render(PlainHost));
    expect(all.length).toBe(3);
    expect(all.every((r) => r.disabled())).toBe(true);
  });

  test('switches the ripple on for every nav and load-more button, and off again', async () => {
    const fixture = await render(SwitchHost);
    expect(ripples(fixture).every((r) => !r.disabled())).toBe(true);

    fixture.componentInstance.on.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(ripples(fixture).every((r) => r.disabled())).toBe(true);
  });

  test('works from an ancestor element', async () => {
    const all = ripples(await render(AncestorHost));
    expect(all.length).toBe(1);
    expect(all[0].disabled()).toBe(false);
  });
});
