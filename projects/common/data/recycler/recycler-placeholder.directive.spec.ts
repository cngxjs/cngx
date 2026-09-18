import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxRecyclerPlaceholder } from './recycler-placeholder.directive';
import type { CngxRecycler } from './recycler';

// Installs a matchMedia stub on the jsdom window. observeMediaQuery reads
// `matchMedia` off DOCUMENT.defaultView, so stubbing the global reaches it.
function installMatchMedia(matching: string[]): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matching.includes(query),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

const ROW_HEIGHT_VAR = '--cngx-recycler-placeholder-row-height';

function mockRecycler(rowSizeHint: number): CngxRecycler {
  return { rowSizeHint: signal(rowSizeHint) } as unknown as CngxRecycler;
}

@Component({
  standalone: true,
  imports: [CngxRecyclerPlaceholder],
  template: `<div cngxRecyclerPlaceholder [rowHeight]="rowHeight()"></div>`,
})
class RowHeightHost {
  readonly rowHeight = signal<number | undefined>(56);
}

@Component({
  standalone: true,
  imports: [CngxRecyclerPlaceholder],
  template: `<div [cngxRecyclerPlaceholder]="recycler"></div>`,
})
class RecyclerHost {
  readonly recycler = mockRecycler(72);
}

describe('CngxRecyclerPlaceholder', () => {
  afterEach(() => {
    // stubGlobal outlives restoreAllMocks; unstub so the matchMedia mock never
    // leaks into a later spec sharing this vitest worker.
    vi.unstubAllGlobals();
  });

  function host<T>(type: new () => T): HTMLElement {
    installMatchMedia([]);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(type);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLElement;
  }

  it('applies the base host class', () => {
    expect(host(RowHeightHost).classList.contains('cngx-recycler-placeholder')).toBe(true);
  });

  it('writes the row-height var from the explicit [rowHeight] fallback', () => {
    expect(host(RowHeightHost).style.getPropertyValue(ROW_HEIGHT_VAR)).toBe('56px');
  });

  it('writes the row-height var from the recycler rowSizeHint', () => {
    expect(host(RecyclerHost).style.getPropertyValue(ROW_HEIGHT_VAR)).toBe('72px');
  });

  it('leaves the row-height var unset when nothing resolves (falls back to the token default)', () => {
    installMatchMedia([]);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });

    @Component({
      standalone: true,
      imports: [CngxRecyclerPlaceholder],
      template: `<div cngxRecyclerPlaceholder></div>`,
    })
    class BareHost {}

    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const el = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue(ROW_HEIGHT_VAR)).toBe('');
  });

  it('applies the shimmer class by default', () => {
    expect(host(RowHeightHost).classList.contains('cngx-recycler-placeholder--shimmer')).toBe(true);
  });

  it('drops the shimmer class under prefers-reduced-motion', () => {
    installMatchMedia(['(prefers-reduced-motion: reduce)']);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(RowHeightHost);
    fixture.detectChanges();
    const el = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLElement;
    expect(el.classList.contains('cngx-recycler-placeholder--shimmer')).toBe(false);
  });
});
