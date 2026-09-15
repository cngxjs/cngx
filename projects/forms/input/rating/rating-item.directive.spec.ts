import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRating } from './rating.component';
import { CngxRatingItem } from './rating-item.directive';

@Component({
  template: `
    <cngx-rating [(value)]="value" [max]="max()" [allowHalf]="allowHalf()">
      <ng-template
        cngxRatingItem
        let-index="index"
        let-step="step"
        let-filled="filled"
        let-half="half"
        let-disabled="disabled"
      >
        <span
          class="glyph"
          [attr.data-index]="index"
          [attr.data-step]="step"
          [attr.data-filled]="filled"
          [attr.data-half]="half"
          [attr.data-disabled]="disabled"
          >{{ filled ? '★' : '☆' }}</span
        >
      </ng-template>
    </cngx-rating>
  `,
  imports: [CngxRating, CngxRatingItem],
})
class Host {
  value = 2;
  readonly max = signal(3);
  readonly allowHalf = signal(false);
}

function setup(): { host: HTMLElement; glyphs: () => HTMLElement[] } {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const glyphs = (): HTMLElement[] =>
    Array.from(host.querySelectorAll<HTMLElement>('.glyph'));
  return { host, glyphs };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('CngxRatingItem', () => {
  it('narrows the template context guard', () => {
    // Type guard is unconditional true - the compile-time narrowing is the
    // contract; the runtime just confirms the guard signature exists.
    expect(CngxRatingItem.ngTemplateContextGuard({} as CngxRatingItem, {})).toBe(true);
  });

  it('overrides the per-star glyph, one stamp per step', () => {
    const { glyphs } = setup();
    expect(glyphs().length).toBe(3);
  });

  it('stamps each star with its typed context (index, step, cumulative fill)', () => {
    const { glyphs } = setup();
    const rows = glyphs().map((g) => ({
      index: g.getAttribute('data-index'),
      step: g.getAttribute('data-step'),
      filled: g.getAttribute('data-filled'),
    }));
    // value=2 → steps 1 and 2 are cumulatively filled, step 3 is not.
    expect(rows).toEqual([
      { index: '0', step: '1', filled: 'true' },
      { index: '1', step: '2', filled: 'true' },
      { index: '2', step: '3', filled: 'false' },
    ]);
  });
});
