import { Component, input, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target) on a fine pointer, where
// `--cngx-target-min` is 0px. A 24px hit box per dot would overlap the next one
// at the 8px dot + 8px gap layout, so the row itself grows: slot plus gap
// reaches 24px (WCAG 2.5.8 spacing). Under `data-touch='on'` the slot reaches
// 44px (WCAG 2.5.5). The markup mirrors `cngx-pgn-dots` with the shipped
// classes; paginator-base.css styles flat classes without encapsulation.

@Component({
  selector: 'cngx-paginator-dots-target-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './styles/paginator-base.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cngx-paginator">
      <div class="cngx-paginator__dots" [class.cngx-paginator__dots--windowed]="count() > 7">
        <div
          class="cngx-paginator__dots-track"
          style="transition: none"
          [style.--cngx-paginator-dots-shift]="firstVisible()"
        >
          @for (index of indexes(); track index) {
            <button
              type="button"
              class="cngx-paginator__dot"
              [class.cngx-paginator__dot--current]="index === current()"
              [attr.aria-current]="index === current() ? 'page' : null"
              [attr.aria-label]="'Page ' + (index + 1)"
            ></button>
          }
        </div>
      </div>
    </div>
  `,
})
class DotsTargetHost {
  readonly count = input(4);
  readonly current = input(0);
  readonly firstVisible = input(0);
  protected indexes(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}

let mountedRoot: HTMLElement | null = null;

function mount(count = 4, current = 0, firstVisible = 0, touch = false): HTMLElement {
  const fixture = TestBed.createComponent(DotsTargetHost);
  fixture.componentRef.setInput('count', count);
  fixture.componentRef.setInput('current', current);
  fixture.componentRef.setInput('firstVisible', firstVisible);
  mountedRoot = fixture.nativeElement as HTMLElement;
  if (touch) {
    mountedRoot.dataset['touch'] = 'on';
  }
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function dots(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.cngx-paginator__dot'));
}

function centreX(el: Element): number {
  const rect = el.getBoundingClientRect();
  return rect.left + rect.width / 2;
}

function paintedSize(dot: HTMLElement): number {
  return parseFloat(getComputedStyle(dot, '::before').width);
}

describe('paginator dots target size', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('spaces the dot centres 24px apart on a fine pointer and keeps the 8px dot', () => {
    const row = dots(mount());
    for (let i = 1; i < row.length; i++) {
      expect(centreX(row[i]) - centreX(row[i - 1])).toBeGreaterThanOrEqual(24);
    }
    expect(paintedSize(row[0])).toBe(8);
    expect(row[0].getBoundingClientRect().width).toBe(16);
  });

  it('lifts each dot slot to 44px under data-touch="on"', () => {
    const row = dots(mount(4, 0, 0, true));
    const rect = row[0].getBoundingClientRect();
    expect(rect.width).toBe(44);
    expect(rect.height).toBe(44);
    expect(paintedSize(row[0])).toBe(8);
  });

  for (const touch of [false, true]) {
    it(`keeps the active dot centred in the windowed viewport (${touch ? 'touch' : 'fine'})`, () => {
      // 11 pages, page 6 active: the window starts at index 2 (6 - 1 - 3).
      const root = mount(11, 5, 2, touch);
      const viewport = root.querySelector('.cngx-paginator__dots')!;
      const active = dots(root)[5];
      expect(Math.abs(centreX(active) - centreX(viewport))).toBeLessThanOrEqual(0.5);
    });
  }
});
