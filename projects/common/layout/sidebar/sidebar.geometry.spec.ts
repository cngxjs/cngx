import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidebar, type CngxSidebarCollapsedAs } from './sidebar.directive';

// Runs in a real Chromium (the `test-geometry` target): real flex layout, so
// the reserved space is measured off the content lane beside the sidebar.

@Component({
  selector: 'cngx-sidebar-geometry-host',
  standalone: true,
  imports: [CngxSidebar],
  encapsulation: ViewEncapsulation.None,
  styles: `
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
  `,
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
});
