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
    .still .cngx-drawer-panel {
      transition: none;
    }
  `,
  template: `
    <div class="cngx-drawer skin-host still">
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
      <main class="cngx-drawer-content"></main>
    </div>
  `,
})
class SkinHost {
  readonly side = signal<Side>('left');
  readonly push = signal(false);
  readonly modal = signal(false);
  readonly open = signal(false);
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

  it('lays a push panel out beside the content and takes no space while closed', () => {
    const { q, set } = mount((h) => h.push.set(true));
    const host = () => q('.skin-host').getBoundingClientRect();
    const content = () => q('.cngx-drawer-content').getBoundingClientRect();
    expect(q('.cngx-drawer-panel').getBoundingClientRect().width).toBe(0);
    expect(content().left).toBe(host().left);
    set((h) => h.open.set(true));
    const panel = q('.cngx-drawer-panel').getBoundingClientRect();
    expect(panel.width).toBe(220);
    expect(content().left).toBe(panel.right);
    expect(content().right).toBe(host().right);
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
