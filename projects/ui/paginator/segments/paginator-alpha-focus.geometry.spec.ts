import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxBucketPaginate, type CngxBucket } from '@cngx/common/data';

import { CngxPaginatorAlpha } from './paginator-alpha.component';

// Runs in a real Chromium (the `test-geometry` target). The alpha strip also
// works under a bare `cngxBucketPaginate`, without the `cngx-paginator` shell
// that routes `--cngx-paginator-focus-ring`. Its focus ring must then fall back
// to the primary colour like every other cngx ring, not to the text colour.

const BUCKETS: readonly CngxBucket<string>[] = [
  { label: 'A-C', match: (n) => n < 'D' },
  { label: 'D-F', match: (n) => n >= 'D' },
];

@Component({
  selector: 'cngx-paginator-alpha-focus-host',
  standalone: true,
  imports: [CngxBucketPaginate, CngxPaginatorAlpha],
  template: `
    <div
      cngxBucketPaginate
      [buckets]="buckets"
      [items]="items"
      style="--cngx-color-primary: rgb(10, 120, 200); color: rgb(20, 20, 20)"
    >
      <cngx-pgn-alpha />
    </div>
  `,
})
class AlphaHost {
  readonly buckets = BUCKETS;
  readonly items = ['Anna', 'Dora'];
}

let mountedRoot: HTMLElement | null = null;

describe('alpha strip focus ring without the paginator shell', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('paints the primary ring, not the text colour', () => {
    const fixture = TestBed.createComponent(AlphaHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const chip = mountedRoot.querySelector<HTMLButtonElement>('.cngx-paginator__alpha-chip')!;
    chip.focus({ focusVisible: true } as FocusOptions);
    expect(chip.matches(':focus-visible')).toBe(true);
    const ring = getComputedStyle(chip);
    expect(ring.outlineStyle).toBe('solid');
    expect(ring.outlineColor).toBe('rgb(10, 120, 200)');
  });
});
