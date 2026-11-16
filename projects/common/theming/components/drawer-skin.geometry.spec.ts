import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target) against the
// working-tree cngx-drawer.css: the panel classes CngxDrawerPanel writes, on
// a `.cngx-drawer` host, no story CSS. `still` drops the slide so every read
// sees the settled position.

type Side = 'left' | 'right' | 'top' | 'bottom';

@Component({
  selector: 'cngx-drawer-skin-host',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../../../core/theming/layers.css', './cngx-drawer.css'],
  styles: `
    .skin-host {
      inline-size: 600px;
      block-size: 300px;
    }
    .still :is(.cngx-drawer-panel, .cngx-drawer-content) {
      transition: none;
    }
  `,
  template: `
    <div class="cngx-drawer skin-host" [class.still]="still()">
      <nav
        class="cngx-drawer-panel"
        [class.cngx-drawer-panel--left]="side() === 'left'"
        [class.cngx-drawer-panel--right]="side() === 'right'"
        [class.cngx-drawer-panel--top]="side() === 'top'"
        [class.cngx-drawer-panel--bottom]="side() === 'bottom'"
        [class.cngx-drawer-panel--over]="!push()"
        [class.cngx-drawer-panel--push]="push()"
        [class.cngx-drawer-panel--modal]="modal()"
        [class.cngx-drawer-panel--open]="open()"
      ></nav>
      <main
        class="cngx-drawer-content"
        [attr.data-drawer-push]="push() && open() ? side() : null"
      ></main>
    </div>
  `,
})
class SkinHost {
  readonly side = signal<Side>('left');
  readonly push = signal(false);
  readonly modal = signal(false);
  readonly open = signal(false);
  readonly still = signal(true);
}

describe('cngx-drawer.css panel skin', () => {
  let root: HTMLElement | null = null;

  afterEach(() => {
    root?.remove();
    root = null;
  });

  function mount(init: (h: SkinHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(SkinHost);
    init(fixture.componentInstance);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    const q = (sel: string) => root?.querySelector(sel) as HTMLElement;
    const set = (fn: (h: SkinHost) => void) => {
      fn(fixture.componentInstance);
      fixture.detectChanges();
    };
    return { q, set };
  }

  const outside = (p: DOMRect, h: DOMRect) =>
    p.right <= h.left + 0.5 ||
    p.left >= h.right - 0.5 ||
    p.bottom <= h.top + 0.5 ||
    p.top >= h.bottom - 0.5;

  const inside = (p: DOMRect, h: DOMRect) =>
    p.left >= h.left - 0.5 &&
    p.right <= h.right + 0.5 &&
    p.top >= h.top - 0.5 &&
    p.bottom <= h.bottom + 0.5;

  for (const side of ['left', 'right', 'top', 'bottom'] as const) {
    it(`puts a closed ${side} panel off the host and an open one on its ${side} edge`, () => {
      const { q, set } = mount((h) => h.side.set(side));
      const host = () => q('.skin-host').getBoundingClientRect();
      const panel = () => q('.cngx-drawer-panel').getBoundingClientRect();
      expect(outside(panel(), host())).toBe(true);
      set((h) => h.open.set(true));
      const p = panel();
      const hb = host();
      expect(inside(p, hb)).toBe(true);
      const edge = { left: p.left - hb.left, right: hb.right - p.right, top: p.top - hb.top, bottom: hb.bottom - p.bottom }[side];
      expect(Math.abs(edge)).toBeLessThan(0.5);
      const horizontal = side === 'left' || side === 'right';
      expect(horizontal ? p.width : p.height).toBe(horizontal ? 220 : 120);
    });
  }

  it('draws the panel border toward the content', () => {
    const { q, set } = mount((h) => h.open.set(true));
    const panel = () => getComputedStyle(q('.cngx-drawer-panel'));
    expect(panel().borderRightWidth).toBe('1px');
    set((h) => h.side.set('right'));
    expect(panel().borderLeftWidth).toBe('1px');
    expect(panel().borderRightWidth).toBe('0px');
  });

  for (const side of ['left', 'right', 'top', 'bottom'] as const) {
    it(`slides a ${side} push panel at full size and moves the content aside by it`, () => {
      const { q, set } = mount((h) => {
        h.side.set(side);
        h.push.set(true);
      });
      const host = () => q('.skin-host').getBoundingClientRect();
      const panel = () => q('.cngx-drawer-panel').getBoundingClientRect();
      const content = () => q('.cngx-drawer-content').getBoundingClientRect();
      const horizontal = side === 'left' || side === 'right';
      const size = horizontal ? 220 : 120;
      expect(outside(panel(), host())).toBe(true);
      expect(horizontal ? panel().width : panel().height).toBe(size);
      expect(content()[side]).toBe(host()[side]);
      set((h) => h.open.set(true));
      const p = panel();
      expect(horizontal ? p.width : p.height).toBe(size);
      const opposite = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' } as const;
      expect(content()[side]).toBe(p[opposite[side]]);
      expect(content()[opposite[side]]).toBe(host()[opposite[side]]);
    });
  }

  it('keeps the push panel width while it closes', () => {
    const { q, set } = mount((h) => {
      h.push.set(true);
      h.open.set(true);
    });
    const panel = q('.cngx-drawer-panel');
    // Settle the open style first, or there is no before-change style to
    // transition from.
    panel.getBoundingClientRect();
    set((h) => {
      h.still.set(false);
      h.open.set(false);
    });
    const hostLeft = q('.skin-host').getBoundingClientRect().left;
    const slide = panel.getAnimations().find((a) => (a as CSSTransition).transitionProperty === 'transform');
    expect(slide).toBeDefined();
    slide!.pause();
    const duration = Number(slide!.effect!.getComputedTiming().duration);
    for (const t of [0.25, 0.5, 0.75]) {
      slide!.currentTime = duration * t;
      const r = panel.getBoundingClientRect();
      expect(r.width).toBe(220);
      // Mid-slide: neither fully in nor fully out.
      expect(r.left).toBeLessThan(hostLeft - 0.5);
      expect(r.right).toBeGreaterThan(hostLeft + 0.5);
    }
  });

  it('paints an open modal panel above the scrim', () => {
    const { q } = mount((h) => {
      h.modal.set(true);
      h.open.set(true);
    });
    const hostEl = q('.skin-host');
    const panelEl = q('.cngx-drawer-panel');
    expect(getComputedStyle(hostEl, '::after').opacity).toBe('1');
    expect(Number(getComputedStyle(panelEl).zIndex)).toBeGreaterThan(
      Number(getComputedStyle(hostEl, '::after').zIndex),
    );
    const p = panelEl.getBoundingClientRect();
    expect(document.elementFromPoint(p.left + p.width / 2, p.top + p.height / 2)).toBe(panelEl);
  });
});
