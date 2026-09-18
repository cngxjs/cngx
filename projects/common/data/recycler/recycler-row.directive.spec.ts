import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxRecyclerRow } from './recycler-row.directive';
import type { CngxRecycler } from './recycler';

interface Row {
  id: number;
  name: string;
}

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
    <li
      *cngxRecyclerRow="item(); index: index(); recycler: recycler; placeholder: ph; let row"
      class="real-row"
    >
      {{ row?.name }}
    </li>
    <ng-template #ph let-idx let-setSize="setSize" let-top="top">
      <li
        class="ph-row"
        role="listitem"
        aria-busy="true"
        [attr.aria-posinset]="idx + 1"
        [attr.aria-setsize]="setSize"
        [attr.data-top]="top"
      >
        loading
      </li>
    </ng-template>
  </ul>`,
})
class Host {
  readonly recycler = mockRecycler(56, 100);
  readonly item = signal<Row | undefined>({ id: 0, name: 'Row 1' });
  readonly index = signal(3);
}

function setup(): { host: Host; el: HTMLElement; flush: () => void } {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return {
    host: fixture.componentInstance,
    el: fixture.nativeElement as HTMLElement,
    flush: () => {
      TestBed.flushEffects();
      fixture.detectChanges();
    },
  };
}

describe('CngxRecyclerRow', () => {
  it('exposes the template context guard', () => {
    expect(CngxRecyclerRow.ngTemplateContextGuard).toBeTypeOf('function');
    expect(
      CngxRecyclerRow.ngTemplateContextGuard(null as unknown as CngxRecyclerRow<unknown>, {}),
    ).toBe(true);
  });

  it('renders the real-row template with $implicit when the item is defined', () => {
    const { el } = setup();
    const real = el.querySelector('.real-row');
    expect(real).not.toBeNull();
    expect(real?.textContent?.trim()).toBe('Row 1');
    expect(el.querySelector('.ph-row')).toBeNull();
  });

  it('renders the placeholder branch when the item is undefined', () => {
    const { host, el, flush } = setup();
    host.item.set(undefined);
    flush();

    expect(el.querySelector('.real-row')).toBeNull();
    const ph = el.querySelector('.ph-row');
    expect(ph).not.toBeNull();
  });

  it('passes index/top/setSize context to the placeholder template', () => {
    const { host, el, flush } = setup();
    host.item.set(undefined);
    flush();

    const ph = el.querySelector('.ph-row') as HTMLElement;
    // index 3 -> posinset 4; setSize 100; top = rowSizeHint(56) * index(3) = 168.
    expect(ph.getAttribute('aria-posinset')).toBe('4');
    expect(ph.getAttribute('aria-setsize')).toBe('100');
    expect(ph.getAttribute('data-top')).toBe('168');
  });

  it('keeps the placeholder row in the a11y tree (busy, listitem, not aria-hidden)', () => {
    const { host, el, flush } = setup();
    host.item.set(undefined);
    flush();

    const ph = el.querySelector('.ph-row') as HTMLElement;
    expect(ph.getAttribute('aria-busy')).toBe('true');
    expect(ph.getAttribute('role')).toBe('listitem');
    expect(ph.hasAttribute('aria-hidden')).toBe(false);
  });

  it('reuses the same real-row view across a defined -> undefined -> defined flip', () => {
    const { host, el, flush } = setup();
    const first = el.querySelector('.real-row');
    expect(first).not.toBeNull();

    host.item.set(undefined);
    flush();
    expect(el.querySelector('.real-row')).toBeNull();

    host.item.set({ id: 1, name: 'Row 2' });
    flush();
    const second = el.querySelector('.real-row');
    // Same DOM node identity => the cached EmbeddedViewRef was re-attached, not remounted.
    expect(second).toBe(first);
    expect(second?.textContent?.trim()).toBe('Row 2');
  });
});
