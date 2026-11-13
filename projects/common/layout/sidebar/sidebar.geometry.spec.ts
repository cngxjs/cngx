import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxNavFooter } from '../../interactive/nav/nav-footer.directive';
import { CngxNavHeader } from '../../interactive/nav/nav-header.directive';
import { CngxNavIcon } from '../../interactive/nav/nav-icon.directive';
import { CngxNavLink } from '../../interactive/nav/nav-link.directive';
import { CngxNavName } from '../../interactive/nav/nav-name.directive';
import { CngxSidebar, type CngxSidebarCollapsedAs, type CngxSidebarSide } from './sidebar.directive';

// Runs in a real Chromium (the `test-geometry` target): real flex layout, so
// the reserved space is measured off the content lane beside the sidebar.

const GEOMETRY_STYLES = `
    .sb-row {
      display: flex;
      inline-size: 900px;
      block-size: 200px;
      --cngx-sidebar-size: 240px;
      --cngx-sidebar-rail-size: 56px;
    }
    .sb-side {
      flex: none;
      overflow: hidden;
      position: relative;
    }
    .sb-main {
      flex: 1;
      min-inline-size: 0;
    }
  `;

@Component({
  selector: 'cngx-sidebar-geometry-host',
  standalone: true,
  imports: [CngxSidebar],
  encapsulation: ViewEncapsulation.None,
  styles: GEOMETRY_STYLES,
  template: `
    <div class="sb-row">
      <aside
        class="sb-side"
        cngxSidebar
        [collapsed]="collapsed()"
        [collapsedAs]="collapsedAs()"
        [expandOnHover]="false"
      ></aside>
      <main class="sb-main"></main>
    </div>
  `,
})
class GeometryHost {
  readonly collapsed = signal(false);
  readonly collapsedAs = signal<CngxSidebarCollapsedAs>('rail');
}

@Component({
  selector: 'cngx-sidebar-end-geometry-host',
  standalone: true,
  imports: [CngxSidebar],
  encapsulation: ViewEncapsulation.None,
  styles: GEOMETRY_STYLES,
  template: `
    <div class="sb-row">
      <main class="sb-main"></main>
      <aside
        class="sb-side"
        cngxSidebar
        side="end"
        [collapsed]="true"
        [expandOnHover]="false"
      ></aside>
    </div>
  `,
})
class EndGeometryHost {}

describe('CngxSidebar geometry', () => {
  let host: HTMLElement | null = null;

  afterEach(() => {
    host?.remove();
    host = null;
  });

  function mount() {
    const fixture = TestBed.createComponent(GeometryHost);
    host = fixture.nativeElement as HTMLElement;
    document.body.appendChild(host);
    fixture.detectChanges();
    const q = (sel: string) => host?.querySelector(sel) as HTMLElement;
    const side = q('.sb-side');
    const sidebar = fixture.debugElement
      .query((d) => d.nativeElement === side)
      .injector.get(CngxSidebar);
    const row = q('.sb-row').getBoundingClientRect();
    const mainOffset = () => q('.sb-main').getBoundingClientRect().left - row.left;
    const set = (fn: (h: GeometryHost) => void) => {
      fn(fixture.componentInstance);
      fixture.detectChanges();
    };
    return { fixture, side, sidebar, mainOffset, set };
  }

  it('reserves the expanded size', () => {
    const { side, mainOffset } = mount();
    expect(side.getBoundingClientRect().width).toBe(240);
    expect(mainOffset()).toBe(240);
  });

  it('reserves the rail size when collapsed as a rail', () => {
    const { side, mainOffset, set } = mount();
    set((h) => h.collapsed.set(true));
    expect(side.getBoundingClientRect().width).toBe(56);
    expect(mainOffset()).toBe(56);
  });

  it('reserves nothing when collapsed as hidden', () => {
    const { mainOffset, set } = mount();
    set((h) => {
      h.collapsedAs.set('hidden');
      h.collapsed.set(true);
    });
    expect(mainOffset()).toBe(0);
  });

  it('overlays a rail peek at full size without moving the content lane', () => {
    const { fixture, side, sidebar, mainOffset, set } = mount();
    set((h) => h.collapsed.set(true));
    const before = mainOffset();

    sidebar.peek();
    fixture.detectChanges();

    expect(side.getBoundingClientRect().width).toBe(240);
    expect(mainOffset()).toBe(before);
    expect(getComputedStyle(side).zIndex).toBe('2');
  });

  it('overlays a hidden peek without moving the content lane', () => {
    const { fixture, side, sidebar, mainOffset, set } = mount();
    set((h) => {
      h.collapsedAs.set('hidden');
      h.collapsed.set(true);
    });

    sidebar.peek();
    fixture.detectChanges();

    expect(side.getBoundingClientRect().width).toBe(240);
    expect(mainOffset()).toBe(0);
  });

  it('overlays an end rail peek towards the start without moving the content lane', () => {
    const fixture = TestBed.createComponent(EndGeometryHost);
    host = fixture.nativeElement as HTMLElement;
    document.body.appendChild(host);
    fixture.detectChanges();
    const side = host.querySelector('.sb-side') as HTMLElement;
    const main = host.querySelector('.sb-main') as HTMLElement;
    const sidebar = fixture.debugElement
      .query((d) => d.nativeElement === side)
      .injector.get(CngxSidebar);
    const row = (host.querySelector('.sb-row') as HTMLElement).getBoundingClientRect();
    const mainWidth = main.getBoundingClientRect().width;

    sidebar.peek();
    fixture.detectChanges();

    const peeked = side.getBoundingClientRect();
    expect(peeked.width).toBe(240);
    expect(peeked.right).toBe(row.right);
    expect(main.getBoundingClientRect().width).toBe(mainWidth);
  });
});

// The base skin: the working-tree cngx-sidebar.css and cngx-nav.css on a
// `.cngx-sidebar` host, no story CSS.
@Component({
  selector: 'cngx-sidebar-skin-geometry-host',
  standalone: true,
  imports: [CngxSidebar, CngxNavLink, CngxNavIcon, CngxNavHeader, CngxNavFooter, CngxNavName],
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../theming/components/cngx-nav.css',
    '../../theming/components/cngx-sidebar.css',
  ],
  styles: `
    .skin-row {
      display: flex;
      inline-size: 900px;
      block-size: 240px;
      --cngx-sidebar-size: 240px;
      --cngx-sidebar-rail-size: 56px;
    }
    .skin-main {
      flex: 1;
      min-inline-size: 0;
      background: white;
    }
  `,
  template: `
    <div class="skin-row">
      @if (side() === 'end') {
        <main class="skin-main"></main>
      }
      <aside
        class="cngx-sidebar"
        cngxSidebar
        [side]="side()"
        [collapsed]="collapsed()"
        [expandOnHover]="false"
      >
        <cngx-nav-header><span cngxNavName>Acme</span></cngx-nav-header>
        @for (row of rows; track row) {
          <a cngxNavLink href="#{{ row }}" class="row-{{ row }}">
            <span cngxNavIcon class="icon-{{ row }}">*</span>{{ row }}
          </a>
        }
        <cngx-nav-footer><span cngxNavName>Jane Doe</span></cngx-nav-footer>
      </aside>
      @if (side() === 'start') {
        <main class="skin-main"></main>
      }
    </div>
  `,
})
class SkinHost {
  readonly side = signal<CngxSidebarSide>('start');
  readonly collapsed = signal(false);
  readonly rows = Array.from({ length: 14 }, (_, i) => `r${i}`);
}

describe('cngx-sidebar.css', () => {
  let root: HTMLElement | null = null;

  afterEach(() => {
    root?.remove();
    root = null;
    document.documentElement.removeAttribute('dir');
  });

  function mount() {
    const fixture = TestBed.createComponent(SkinHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    const q = (sel: string) => root?.querySelector(sel) as HTMLElement;
    const side = () => q('.cngx-sidebar');
    const sidebar = () =>
      fixture.debugElement.query((d) => d.nativeElement === side()).injector.get(CngxSidebar);
    const set = (fn: (h: SkinHost) => void) => {
      fn(fixture.componentInstance);
      fixture.detectChanges();
    };
    return { fixture, q, side, sidebar, set };
  }

  function borders(el: HTMLElement) {
    const cs = getComputedStyle(el);
    return { left: cs.borderLeftWidth, right: cs.borderRightWidth };
  }

  it('draws the border on the side facing the content, start and end', () => {
    const { side, set } = mount();
    expect(borders(side())).toEqual({ left: '0px', right: '1px' });
    set((h) => h.side.set('end'));
    expect(borders(side())).toEqual({ left: '1px', right: '0px' });
  });

  it('mirrors the border under RTL', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const { side } = mount();
    expect(borders(side())).toEqual({ left: '1px', right: '0px' });
  });

  it('keeps header and footer in view while the rows scroll', () => {
    const { q, side } = mount();
    const host = side();
    expect(host.scrollHeight).toBeGreaterThan(host.clientHeight);
    host.scrollTop = host.scrollHeight;
    const box = host.getBoundingClientRect();
    expect(Math.abs(q('.cngx-nav-header').getBoundingClientRect().top - box.top)).toBeLessThan(1.5);
    expect(Math.abs(q('.cngx-nav-footer').getBoundingClientRect().bottom - box.bottom)).toBeLessThan(
      1.5,
    );
  });

  it('paints a peek above the content with a shadow', () => {
    const { fixture, side, sidebar, set } = mount();
    set((h) => h.collapsed.set(true));
    sidebar().peek();
    fixture.detectChanges();
    const cs = getComputedStyle(side());
    expect(side().getAttribute('data-sidebar-state')).toBe('peek');
    expect(cs.boxShadow).not.toBe('none');
    expect(Number(cs.zIndex)).toBeGreaterThan(0);
  });

  it('keeps a railed row icon box at its expanded x and y, label clipped', () => {
    const { q, set } = mount();
    const expanded = q('.icon-r1').getBoundingClientRect();
    set((h) => h.collapsed.set(true));
    const railed = q('.icon-r1').getBoundingClientRect();
    expect(Math.abs(railed.x - expanded.x)).toBeLessThan(0.5);
    expect(Math.abs(railed.y - expanded.y)).toBeLessThan(0.5);
    const row = q('.row-r1');
    expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
    expect(getComputedStyle(row).overflowX).toBe('clip');
  });
});
