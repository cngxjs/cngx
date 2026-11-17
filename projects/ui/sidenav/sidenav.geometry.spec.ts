import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, containerState } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';
import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';

// Runs in a real Chromium (the `test-geometry` target). Guards the recorded
// mini-rail trap: `--cngx-sidenav-mini-width` is registered `inherits: true`
// so descendants read the host-configured width instead of freezing at the
// 56px registered initial. `inherits: false` reintroduced the overflow bug the
// memory records; this asserts the configured width reaches the body and that
// the collapsed body fits inside the rail border.

@Component({
  selector: 'cngx-sidenav-geometry-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav
        mode="side"
        [collapsed]="true"
        [miniWidth]="'72px'"
        [expandOnHover]="false"
        ariaLabel="Nav"
      >
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
  const host = mountedRoot.querySelector('cngx-sidenav[data-sidebar-state="rail"]');
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
    expect(host.getAttribute('data-sidebar-state')).toBe('rail');
    // The 1px edge border sits inside the 72px rail (border-box sizing).
    expect(host.getBoundingClientRect().width).toBeCloseTo(72, 0);
  });

  it('inherits the configured mini-width down to the collapsed body', () => {
    const { body } = mount();
    // The token set on the host must reach the body; inherits: false would leave
    // it at the 56px registered initial.
    expect(computedValue(body, '--cngx-sidenav-mini-width')).toBe('72px');
  });

  it('fits the collapsed body inside the rail border', () => {
    const { host, body } = mount();
    // 72px rail minus the 1px edge border: a body as wide as the rail would
    // run under the border and push every row off centre.
    expect(body.getBoundingClientRect().width).toBeCloseTo(71, 1);
    expect(body.getBoundingClientRect().right).toBeLessThanOrEqual(
      host.getBoundingClientRect().right - 1 + 0.05,
    );
  });

  it('insets the body rows from the panel edge like the nav-rail body', () => {
    const { body } = mount();
    expect(computedValue(body, 'padding-block-start')).toBe('4px');
    expect(computedValue(body, 'padding-block-end')).toBe('4px');
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
// @container rule block resolves `--cngx-sidenav-width-class` on the rail, the
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

@Component({
  selector: 'cngx-sidenav-auto-medium-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <div class="auto-medium-wrapper">
      <cngx-sidenav-layout>
        <cngx-sidenav position="start" ariaLabel="Nav">Nav</cngx-sidenav>
        <cngx-sidenav-content>Main</cngx-sidenav-content>
      </cngx-sidenav-layout>
    </div>
  `,
  styles: ['.auto-medium-wrapper { inline-size: 56rem; }'],
})
class SidenavAutoMediumHost {}

function railTransitions(rail: HTMLElement, content: HTMLElement): string[] {
  const found: string[] = [];
  for (const el of [rail, content]) {
    for (const animation of el.getAnimations()) {
      if (animation instanceof CSSTransition) {
        found.push(`${el.localName}: ${animation.transitionProperty}`);
      }
    }
  }
  return found;
}

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

// Transitions exist only once the layout has painted its settled state.
async function settled(root: HTMLElement): Promise<void> {
  for (let frame = 0; frame < 10; frame++) {
    if (root.querySelector('cngx-sidenav-layout.cngx-sidenav-layout--ready')) {
      return;
    }
    await nextFrame();
  }
  throw new Error('cngx-sidenav-layout never turned --ready');
}

describe('CngxSidenav auto mode geometry', () => {
  it('names the layout as an inline-size query container', () => {
    const { layout } = mountAuto();
    const state = containerState(layout);
    expect(state.type).toBe('inline-size');
    expect(state.name).toBe('cngx-sidenav-layout');
  });

  it('resolves the width class on the rail, switching at exactly 48rem and 64rem', () => {
    const { rail, setWidth } = mountAuto();
    setWidth('47.9rem');
    expect(computedValue(rail, '--cngx-sidenav-width-class')).toBe('compact');
    setWidth('48rem');
    expect(computedValue(rail, '--cngx-sidenav-width-class')).toBe('medium');
    setWidth('63.9rem');
    expect(computedValue(rail, '--cngx-sidenav-width-class')).toBe('medium');
    setWidth('64rem');
    expect(computedValue(rail, '--cngx-sidenav-width-class')).toBe('expanded');
  });

  it('overlays in compact and docks in medium and expanded', async () => {
    const { rail, setWidth } = mountAuto();

    setWidth('40rem');
    await nextFrame();
    expect(rail.classList.contains('cngx-sidenav--over')).toBe(true);
    expect(rail.classList.contains('cngx-sidenav--side')).toBe(false);

    setWidth('56rem');
    await nextFrame();
    expect(rail.classList.contains('cngx-sidenav--side')).toBe(true);
    expect(rail.classList.contains('cngx-sidenav--over')).toBe(false);

    setWidth('80rem');
    await nextFrame();
    expect(rail.classList.contains('cngx-sidenav--side')).toBe(true);
    expect(rail.classList.contains('cngx-sidenav--over')).toBe(false);
  });

  // The width class arrives with the container's first ResizeObserver entry,
  // after the first render. A --ready gate opened before it let the rail slide
  // from the compact drawer to its rail width and drag the content margin along.
  it('settles a medium rail on load without a transition', async () => {
    const fixture = TestBed.createComponent(SidenavAutoMediumHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const layout = mountedRoot.querySelector('cngx-sidenav-layout') as HTMLElement;
    const rail = mountedRoot.querySelector('cngx-sidenav') as HTMLElement;
    const content = mountedRoot.querySelector('cngx-sidenav-content') as HTMLElement;

    const transitions: string[] = [];
    for (let frame = 0; frame < 8; frame++) {
      transitions.push(...railTransitions(rail, content));
      await nextFrame();
    }

    expect(layout.classList.contains('cngx-sidenav-layout--ready')).toBe(true);
    expect(rail.getAttribute('data-sidebar-state')).toBe('rail');
    expect(transitions).toEqual([]);
  });

  // A display:none container reports a 0 inline size and reads as compact,
  // so the gate stays shut until the layout is shown, then opens without
  // animating.
  it('keeps the gate shut while mounted hidden and settles without a transition once shown', async () => {
    const fixture = TestBed.createComponent(SidenavAutoMediumHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    mountedRoot.style.display = 'none';
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const layout = mountedRoot.querySelector('cngx-sidenav-layout') as HTMLElement;
    const rail = mountedRoot.querySelector('cngx-sidenav') as HTMLElement;
    const content = mountedRoot.querySelector('cngx-sidenav-content') as HTMLElement;

    await nextFrame();
    await nextFrame();
    expect(layout.classList.contains('cngx-sidenav-layout--ready')).toBe(false);

    mountedRoot.style.display = '';
    const transitions: string[] = [];
    for (let frame = 0; frame < 8; frame++) {
      transitions.push(...railTransitions(rail, content));
      await nextFrame();
    }

    expect(layout.classList.contains('cngx-sidenav-layout--ready')).toBe(true);
    expect(rail.getAttribute('data-sidebar-state')).toBe('rail');
    expect(transitions).toEqual([]);
  });
});

// F7: the surface moves focus into the drawer while it is still translated
// off-canvas. A script-scrollable layout (overflow: hidden) would scroll by
// the rail width; overflow: clip is never a scroll container.
@Component({
  selector: 'cngx-sidenav-focus-scroll-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <cngx-sidenav-layout style="inline-size: 30rem; block-size: 20rem">
      <cngx-sidenav #nav="cngxSidenav" mode="over" ariaLabel="Nav">
        <a href="#a" class="first">First</a>
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
})
class SidenavFocusScrollHost {}

describe('CngxSidenav overlay focus geometry', () => {
  it('clips the layout, so focusing into the off-canvas drawer cannot scroll it', () => {
    const fixture = TestBed.createComponent(SidenavFocusScrollHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const layout = mountedRoot.querySelector('cngx-sidenav-layout') as HTMLElement;
    const rail = mountedRoot.querySelector('cngx-sidenav') as HTMLElement;
    expect(getComputedStyle(layout).overflowX).toBe('clip');

    // The closed drawer sits translated off the inline-start edge; focusing
    // into it, or a script scroll, must leave the layout where it is.
    (rail.querySelector('.first') as HTMLElement).focus({ preventScroll: false });
    layout.scrollLeft = 200;
    expect(layout.scrollLeft).toBe(0);
    fixture.destroy();
  });
});

// F11 mechanism: the scrim fades on the panel's duration token, an open
// overlay casts --cngx-sidenav-overlay-shadow, a hidden rest has no hairline.
@Component({
  selector: 'cngx-sidenav-f11-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <cngx-sidenav-layout style="inline-size: 30rem; block-size: 20rem; --cngx-duration-base: 0.4s">
      <cngx-sidenav mode="over" ariaLabel="Nav" [opened]="open">Nav</cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
      <cngx-sidenav
        position="end"
        mode="side"
        collapsedAs="hidden"
        [collapsed]="true"
        ariaLabel="Inspector"
        >Inspector</cngx-sidenav
      >
    </cngx-sidenav-layout>
  `,
})
class SidenavF11Host {
  open = false;
}

describe('CngxSidenav overlay visuals (F11)', () => {
  function mountF11() {
    const fixture = TestBed.createComponent(SidenavF11Host);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const root = mountedRoot;
    return {
      fixture,
      backdrop: root.querySelector('.cngx-sidenav-backdrop') as HTMLElement,
      start: root.querySelector('cngx-sidenav.cngx-sidenav--start') as HTMLElement,
      end: root.querySelector('cngx-sidenav.cngx-sidenav--end') as HTMLElement,
    };
  }

  it('fades the backdrop on the panel duration token instead of snapping', async () => {
    const { fixture, backdrop, start } = mountF11();
    await settled(fixture.nativeElement as HTMLElement);
    expect(getComputedStyle(backdrop).opacity).toBe('0');
    const railDuration = getComputedStyle(start)
      .getPropertyValue('--cngx-sidenav-transition-duration')
      .trim();
    expect(railDuration).toBe('0.4s');
    expect(getComputedStyle(backdrop).transitionDuration.split(',')[0].trim()).toBe(railDuration);
    fixture.destroy();
  });

  it('casts the overlay shadow on an open over rail', async () => {
    const { fixture, start } = mountF11();
    fixture.componentInstance.open = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await nextFrame();
    expect(getComputedStyle(start).boxShadow).not.toBe('none');
    // Close before teardown: the open page-modal surface holds inert on the
    // page, released on the close edge.
    fixture.componentInstance.open = false;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    fixture.destroy();
  });

  it('leaves no border hairline on a hidden rest', () => {
    const { fixture, end } = mountF11();
    expect(end.getAttribute('data-sidebar-state')).toBe('hidden');
    expect(end.getBoundingClientRect().width).toBe(0);
    fixture.destroy();
  });
});

// A docked rail that narrows into a page-modal drawer while focus is inside
// stays open (the width-class reset keeps it); the surface engaged with focus
// already inside, so there is no opener. Close lands on the trigger.
@Component({
  selector: 'cngx-sidenav-narrow-under-focus-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <button class="trigger" type="button" [attr.aria-controls]="nav.id()" (click)="nav.toggle()">
      Toggle navigation
    </button>
    <div class="frame" style="inline-size: 70rem">
      <cngx-sidenav-layout style="block-size: 20rem">
        <cngx-sidenav #nav [(opened)]="open" ariaLabel="Nav">
          <button class="link" type="button">Dashboard</button>
        </cngx-sidenav>
        <cngx-sidenav-content>Main</cngx-sidenav-content>
      </cngx-sidenav-layout>
    </div>
  `,
})
class SidenavNarrowUnderFocusHost {
  open = false;
}

describe('CngxSidenav focus after an expanded to compact change under focus', () => {
  it('restores focus to the trigger on Escape', async () => {
    const fixture = TestBed.createComponent(SidenavNarrowUnderFocusHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const root = mountedRoot;
    const rail = root.querySelector('cngx-sidenav') as HTMLElement;
    const link = root.querySelector('.link') as HTMLElement;
    const trigger = root.querySelector('.trigger') as HTMLElement;
    for (let i = 0; i < 10 && rail.classList.contains('cngx-sidenav--over'); i++) {
      await nextFrame();
      fixture.detectChanges();
    }
    expect(rail.classList.contains('cngx-sidenav--side')).toBe(true);
    for (let i = 0; i < 30 && document.activeElement !== link; i++) {
      link.focus();
      await nextFrame();
    }
    expect(document.activeElement).toBe(link);

    (root.querySelector('.frame') as HTMLElement).style.inlineSize = '30rem';
    for (let i = 0; i < 20 && rail.getAttribute('aria-modal') !== 'true'; i++) {
      await nextFrame();
      fixture.detectChanges();
    }
    expect(rail.getAttribute('aria-modal')).toBe('true');
    expect(rail.contains(document.activeElement)).toBe(true);

    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await nextFrame();
    fixture.detectChanges();

    expect(rail.getAttribute('aria-modal')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fixture.destroy();
  });
});

@Component({
  selector: 'cngx-sidenav-resize-geometry-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <cngx-sidenav-layout style="block-size: 300px">
      <cngx-sidenav mode="side" [opened]="true" [resizable]="true" ariaLabel="Nav">
        <button type="button" class="nav-row" style="display: block; inline-size: 100%">
          Row
        </button>
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
})
class ResizableSidenavHost {}

// WCAG 2.5.8 on a mouse: `--cngx-target-min` is 0px on a fine pointer, so the
// handle hit zone reaches 24px through its own token while the bar stays 4px.
describe('CngxSidenav resize handle hit zone on a fine pointer', () => {
  it('grabs 24px centred on the rail edge and leaves the nav row 13px inside', () => {
    const fixture = TestBed.createComponent(ResizableSidenavHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const handle = mountedRoot.querySelector<HTMLElement>('.cngx-sidenav__resize-handle');
    const row = mountedRoot.querySelector<HTMLElement>('.nav-row');
    if (!handle || !row) {
      throw new Error('resizable cngx-sidenav did not render its handle and row');
    }
    const bar = handle.getBoundingClientRect();
    expect(bar.width).toBe(4);
    expect(parseFloat(getComputedStyle(handle, '::before').width)).toBe(24);
    const edge = bar.left + bar.width / 2;
    const y = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
    expect(document.elementFromPoint(edge - 11, y)).toBe(handle);
    // Past the rail edge: the resizable rail must not clip the outer half.
    expect(document.elementFromPoint(edge + 11, y)).toBe(handle);
    expect(document.elementFromPoint(edge - 13, y)?.closest('.nav-row')).toBe(row);
  });

  it('lets the 44px touch zone reach 22px past the rail edge', () => {
    const fixture = TestBed.createComponent(ResizableSidenavHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    // What system-tokens.css resolves on a coarse pointer or `data-touch='on'`.
    mountedRoot.style.setProperty('--cngx-target-min', '44px');
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const handle = mountedRoot.querySelector<HTMLElement>('.cngx-sidenav__resize-handle')!;
    const bar = handle.getBoundingClientRect();
    const edge = bar.left + bar.width / 2;
    const y = bar.top + bar.height / 2;
    expect(document.elementFromPoint(edge + 21, y)).toBe(handle);
    expect(document.elementFromPoint(edge - 21, y)).toBe(handle);
  });
});
