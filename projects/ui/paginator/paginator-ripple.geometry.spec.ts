import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRipple } from '@cngx/common/interactive';
import {
  CngxPaginator,
  CngxPaginatorLast,
  CngxPaginatorLoadMore,
  CngxPaginatorNext,
  CngxPaginatorPrev,
} from '@cngx/ui/paginator';

// Runs in a real Chromium (the `test-geometry` target). The segments ship no
// ripple; a consumer co-hosts `cngxRipple` on a single-button segment, and the
// wave layer must take the button's shape.

@Component({
  selector: 'cngx-paginator-ripple-geometry-host',
  standalone: true,
  imports: [
    CngxPaginator,
    CngxPaginatorPrev,
    CngxPaginatorNext,
    CngxPaginatorLast,
    CngxPaginatorLoadMore,
    CngxRipple,
  ],
  // The ripple layer styles ship in the themes bundle, not with the directive.
  styleUrls: ['../../core/theming/layers.css', '../../common/theming/components/cngx-ripple.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-paginator class="plain" [total]="100" [pageIndex]="3">
      <cngx-pgn-prev />
      <cngx-pgn-next cngxRipple [rippleCentered]="true" />
      <cngx-pgn-load-more cngxRipple />
    </cngx-paginator>
    <cngx-paginator class="bar" skin="bar" [total]="100" [pageIndex]="3">
      <cngx-pgn-prev />
      <cngx-pgn-next cngxRipple [rippleCentered]="true" />
      <cngx-pgn-last cngxRipple [rippleCentered]="true" />
    </cngx-paginator>
  `,
})
class RippleHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(RippleHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function press(segment: HTMLElement): HTMLElement {
  const rect = segment.getBoundingClientRect();
  segment.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }),
  );
  const layer = segment.querySelector<HTMLElement>(':scope > .cngx-ripple__container');
  if (!layer) {
    throw new Error('no ripple layer after the press');
  }
  return layer;
}

describe('paginator segment co-hosting cngxRipple', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('ships no ripple on a plain segment', () => {
    const root = mount();
    const prev = root.querySelector<HTMLElement>('.plain cngx-pgn-prev')!;
    expect(prev.querySelector('.cngx-ripple')).toBeNull();
    expect(prev.classList.contains('cngx-ripple')).toBe(false);
  });

  for (const selector of ['cngx-pgn-next', 'cngx-pgn-load-more']) {
    it(`clips the wave to the button shape on ${selector}`, () => {
      const root = mount();
      const segment = root.querySelector<HTMLElement>(`.plain ${selector}`)!;
      const button = segment.querySelector<HTMLElement>('button')!;
      const layer = press(segment);
      expect(getComputedStyle(layer).borderTopLeftRadius).toBe(
        getComputedStyle(button).borderTopLeftRadius,
      );
      const box = layer.getBoundingClientRect();
      const target = button.getBoundingClientRect();
      expect(box.width).toBe(target.width);
      expect(box.height).toBe(target.height);
    });
  }

  it('keeps the wave square in an inner bar cell and rounds it at the bar end', () => {
    const root = mount();
    const inner = press(root.querySelector<HTMLElement>('.bar cngx-pgn-next')!);
    expect(getComputedStyle(inner).borderTopRightRadius).toBe('0px');
    const end = press(root.querySelector<HTMLElement>('.bar cngx-pgn-last')!);
    expect(getComputedStyle(end).borderTopLeftRadius).toBe('0px');
    expect(getComputedStyle(end).borderTopRightRadius).not.toBe('0px');
  });
});
