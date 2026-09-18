import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxRecyclerRow } from './recycler-row.directive';
import type { CngxRecycler } from './recycler';

function mockRecycler(rowSizeHint: number, ariaSetSize: number): CngxRecycler {
  return {
    rowSizeHint: signal(rowSizeHint),
    ariaSetSize: signal(ariaSetSize),
  } as unknown as CngxRecycler;
}

@Component({
  standalone: true,
  imports: [CngxRecyclerRow],
  template: `<ul>
    <li *cngxRecyclerRow="item(); index: 0; recycler: recycler">{{ item()?.name }}</li>
  </ul>`,
})
class Host {
  readonly recycler = mockRecycler(56, 100);
  readonly item = signal<{ id: number; name: string } | undefined>({ id: 0, name: 'Row 1' });
}

describe('CngxRecyclerRow', () => {
  it('instantiates in a host without error', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('exposes the template context guard', () => {
    expect(CngxRecyclerRow.ngTemplateContextGuard).toBeTypeOf('function');
    expect(
      CngxRecyclerRow.ngTemplateContextGuard(null as unknown as CngxRecyclerRow<unknown>, {}),
    ).toBe(true);
  });
});
