import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, containerState } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';
import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';

// Runs in a real Chromium (the `test-geometry` target). Guards the recorded
// mini-rail trap: `--cngx-sidenav-mini-width` is registered `inherits: true`
// precisely so the collapsed `.cngx-sidenav__body` (a descendant) reads the
// host-configured width for its `min-width` reserve instead of freezing at the
// 56px registered initial. `inherits: false` reintroduced the overflow bug the
// memory records; this asserts the configured width reaches the body.

@Component({
  selector: 'cngx-sidenav-geometry-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav mode="mini" [miniWidth]="'72px'" [expandOnHover]="false" ariaLabel="Nav">
        Nav
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
})
class SidenavHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): { host: HTMLElement; body: HTMLElement } {
  const fixture = TestBed.createComponent(SidenavHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-sidenav.cngx-sidenav--mini');
  const body = host?.querySelector('.cngx-sidenav__body');
  if (!host || !body) {
    throw new Error('mini cngx-sidenav did not render a body');
  }
  return { host: host as HTMLElement, body: body as HTMLElement };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  // isolate: false shares one environment across the file - a leaked dir would
  // corrupt every later spec's resolved direction.
  document.documentElement.removeAttribute('dir');
});

describe('CngxSidenav mini-rail geometry', () => {
  it('collapses to the mini rail without expanding', () => {
    const { host } = mount();
    expect(host.classList.contains('cngx-sidenav--mini')).toBe(true);
    expect(host.classList.contains('cngx-sidenav--expanded')).toBe(false);
  });

  it('inherits the configured mini-width down to the collapsed body', () => {
    const { body } = mount();
    // The token set on the host must reach the body; inherits: false would leave
    // it at the 56px registered initial.
    expect(computedValue(body, '--cngx-sidenav-mini-width')).toBe('72px');
    expect(parseFloat(computedValue(body, 'min-width'))).toBeCloseTo(72, 1);
  });
});

// The overlay drawer parks off-canvas via a physical `translateX(±100%)` (the
// hide transform is self-relative, so it cannot be expressed logically). The
// `:dir(rtl)` override flips that sign by RESOLVED direction - the assertion
// that the drawer parks off the opposite edge under `dir=rtl` is what proves the
// override fired, and doing it by resolved direction is what makes it survive a
// CngxDir directional island (an `[dir='rtl']` ancestor selector would not).
@Component({
  selector: 'cngx-sidenav-rtl-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav mode="over" position="start" ariaLabel="Nav">Nav</cngx-sidenav>
      <cngx-sidenav-content>Main content body</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
})
class SidenavOverHost {}

function mountOver(dir: 'ltr' | 'rtl'): { host: HTMLElement; layout: HTMLElement } {
  document.documentElement.setAttribute('dir', dir);
  const fixture = TestBed.createComponent(SidenavOverHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const layout = mountedRoot.querySelector('cngx-sidenav-layout');
  const host = mountedRoot.querySelector('cngx-sidenav.cngx-sidenav--over');
  if (!layout || !host) {
    throw new Error('over cngx-sidenav did not render');
  }
  return { host: host as HTMLElement, layout: layout as HTMLElement };
}

describe('CngxSidenav RTL geometry (:dir scoping)', () => {
  it('parks the closed overlay drawer off the inline-start (left) edge in LTR', () => {
    const { host, layout } = mountOver('ltr');
    const h = host.getBoundingClientRect();
    const l = layout.getBoundingClientRect();
    // translateX(-100%) pushes the drawer fully off the left edge: its right edge
    // lands at (or before) the layout's left edge.
    expect(h.right).toBeLessThanOrEqual(l.left + 1);
  });

  it('parks the closed overlay drawer off the inline-start (right) edge under :dir(rtl)', () => {
    const { host, layout } = mountOver('rtl');
    const h = host.getBoundingClientRect();
    const l = layout.getBoundingClientRect();
    // :dir(rtl) flips the physical translate to translateX(100%): the drawer parks
    // off the now-right inline-start edge, its left edge at (or after) the layout's
    // right edge. If the override had NOT matched, the base translateX(-100%) would
    // leave the drawer on-screen at the right and this would fail.
    expect(h.left).toBeGreaterThanOrEqual(l.right - 1);
  });
});

// ── Auto mode: the container-driven docking decision (sidenav-layout.css) ────
//
// This is the suite that proves the plan's central claim, and it can only live
// here: jsdom evaluates no container query, so every jsdom test of auto mode
// has to stub the property read. Here the real cascade runs - the layout's
// @container rule resolves `--cngx-sidenav-layout-wide` on the rail, the
// component reads that value back through CngxContainer.property(), and the
// resolved mode lands on the host as a class.

@Component({
  selector: 'cngx-sidenav-auto-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <div class="auto-wrapper">
      <cngx-sidenav-layout>
        <cngx-sidenav position="start" ariaLabel="Nav">Nav</cngx-sidenav>
        <cngx-sidenav-content>Main</cngx-sidenav-content>
      </cngx-sidenav-layout>
    </div>
  `,
  styles: ['.auto-wrapper { inline-size: 40rem; }'],
})
class SidenavAutoHost {}

function mountAuto(): {
  wrapper: HTMLElement;
  layout: HTMLElement;
  rail: HTMLElement;
  setWidth: (value: string) => void;
} {
  const fixture = TestBed.createComponent(SidenavAutoHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const wrapper = mountedRoot.querySelector('.auto-wrapper');
  const layout = mountedRoot.querySelector('cngx-sidenav-layout');
  const rail = mountedRoot.querySelector('cngx-sidenav');
  if (!wrapper || !layout || !rail) {
    throw new Error('auto-mode sidenav did not render');
  }
  return {
    wrapper: wrapper as HTMLElement,
    layout: layout as HTMLElement,
    rail: rail as HTMLElement,
    setWidth: (value) => {
      (wrapper as HTMLElement).style.inlineSize = value;
      // The ResizeObserver callback that feeds property() is async; the CSS
      // side is not, so the custom property is already correct here and the
      // class assertions below run after an explicit flush in each test.
      fixture.detectChanges();
    },
  };
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

describe('CngxSidenav auto mode geometry', () => {
  it('names the layout as an inline-size query container', () => {
    const { layout } = mountAuto();
    const state = containerState(layout);
    expect(state.type).toBe('inline-size');
    expect(state.name).toBe('cngx-sidenav-layout');
  });

  it('resolves the docking property on the rail, not on the layout', () => {
    const { rail, setWidth } = mountAuto();
    setWidth('40rem');
    expect(computedValue(rail, '--cngx-sidenav-layout-wide')).toBe('0');
    setWidth('80rem');
    expect(computedValue(rail, '--cngx-sidenav-layout-wide')).toBe('1');
  });

  it('overlays below the threshold and docks at or above it', async () => {
    const { rail, setWidth } = mountAuto();

    setWidth('40rem');
    await nextFrame();
    expect(rail.classList.contains('cngx-sidenav--over')).toBe(true);
    expect(rail.classList.contains('cngx-sidenav--side')).toBe(false);

    setWidth('80rem');
    await nextFrame();
    expect(rail.classList.contains('cngx-sidenav--side')).toBe(true);
    expect(rail.classList.contains('cngx-sidenav--over')).toBe(false);
  });
});
