import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, containerState } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxBreadcrumbBar } from './breadcrumb-bar.component';
import type { CngxBreadcrumbCrumb } from './breadcrumb.types';

// Runs in a real Chromium (the `test-geometry` target). The default (unskinned)
// layout the `.cngx-breadcrumb` block SETs (breadcrumb-bar.component.css:1): the
// host is a block, the crumb list is a wrapping horizontal flex row whose gap is
// derived from the `--cngx-space-*` scale so a `[data-density]` swap compacts it,
// and each crumb is an inline-flex cell. jsdom reports `''` for every one of
// these reads.

const TRAIL: readonly CngxBreadcrumbCrumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'The Hobbit' },
];

@Component({
  selector: 'cngx-breadcrumb-geometry-host',
  standalone: true,
  imports: [CngxBreadcrumbBar],
  template: `<cngx-breadcrumb [items]="items" [label]="'Breadcrumb'" />`,
})
class BreadcrumbHost {
  readonly items = TRAIL;
}

@Component({
  selector: 'cngx-breadcrumb-ribbon-geometry-host',
  standalone: true,
  imports: [CngxBreadcrumbBar],
  template: `<cngx-breadcrumb [items]="items" [label]="'Breadcrumb'" skin="ribbon" />`,
})
class RibbonBreadcrumbHost {
  readonly items = TRAIL;
}

@Component({
  selector: 'cngx-breadcrumb-header-geometry-host',
  standalone: true,
  imports: [CngxBreadcrumbBar],
  template: `<cngx-breadcrumb [items]="items" [label]="'Breadcrumb'" skin="header" />`,
})
class HeaderBreadcrumbHost {
  readonly items = TRAIL;
}

const LONG_TRAIL: readonly CngxBreadcrumbCrumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'Fiction', href: '/catalog/fiction' },
  { label: 'Fantasy', href: '/catalog/fiction/fantasy' },
  { label: 'The Hobbit' },
];

@Component({
  selector: 'cngx-breadcrumb-cap-geometry-host',
  standalone: true,
  imports: [CngxBreadcrumbBar],
  template: `<cngx-breadcrumb [items]="items" [label]="'Breadcrumb'" />`,
})
class CapBreadcrumbHost {
  readonly items = LONG_TRAIL;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(BreadcrumbHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-breadcrumb');
  if (!host) {
    throw new Error('cngx-breadcrumb did not render');
  }
  return host as HTMLElement;
}

function mountRibbon(): HTMLElement {
  const fixture = TestBed.createComponent(RibbonBreadcrumbHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-breadcrumb');
  if (!host) {
    throw new Error('cngx-breadcrumb did not render');
  }
  return host as HTMLElement;
}

function mountHeader(): HTMLElement {
  const fixture = TestBed.createComponent(HeaderBreadcrumbHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-breadcrumb');
  if (!host) {
    throw new Error('cngx-breadcrumb did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  // isolate:false shares the browser env across specs, so a forced dir would
  // leak into every later geometry read. Reset it after each RTL case.
  document.documentElement.removeAttribute('dir');
});

describe('CngxBreadcrumbBar container-driven cap', () => {
  // The crumb cap is a @container rule writing --cngx-breadcrumb-max-visible on
  // ::after; the bar reads it back and collapses the middle. Only a real engine
  // resolves that cascade, so the rungs are asserted here and nowhere else.
  const nextFrame = (): Promise<void> =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  function mountCap(width: string): HTMLElement {
    const fixture = TestBed.createComponent(CapBreadcrumbHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    mountedRoot.style.inlineSize = width;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const host = mountedRoot.querySelector('.cngx-breadcrumb');
    if (!host) {
      throw new Error('cngx-breadcrumb did not render');
    }
    return host as HTMLElement;
  }

  const capOf = (host: HTMLElement): string =>
    getComputedStyle(host, '::after').getPropertyValue('--cngx-breadcrumb-max-visible').trim();

  const collapsed = (host: HTMLElement): boolean =>
    host.querySelector('cngx-breadcrumb-overflow') !== null;

  it('declares an inline-size container named cngx-breadcrumb', () => {
    const state = containerState(mountCap('70rem'));
    expect(state.type).toBe('inline-size');
    expect(state.name).toBe('cngx-breadcrumb');
  });

  it('caps at 6 above the 48rem rung, so a five-crumb trail stays whole', async () => {
    const host = mountCap('70rem');
    await nextFrame();
    expect(capOf(host)).toBe('6');
    expect(collapsed(host)).toBe(false);
  });

  it('caps at 4 between the rungs, collapsing the five-crumb trail', async () => {
    const host = mountCap('35rem');
    await nextFrame();
    expect(capOf(host)).toBe('4');
    expect(collapsed(host)).toBe(true);
  });

  it('caps at 2 below the 30rem rung', async () => {
    const host = mountCap('25rem');
    await nextFrame();
    expect(capOf(host)).toBe('2');
    expect(collapsed(host)).toBe(true);
  });
});

describe('CngxBreadcrumbBar geometry', () => {
  it('renders the host as a block and the list as a wrapping flex row', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('block');
    const list = query(host, '.cngx-breadcrumb__list');
    expect(computedValue(list, 'display')).toBe('flex');
    expect(computedValue(list, 'flex-wrap')).toBe('wrap');
    expect(computedValue(list, 'align-items')).toBe('center');
  });

  it('lays each crumb out as a centred flex cell', () => {
    const host = mount();
    // The crumb is authored `inline-flex`; as a flex item of the `__list` it is
    // blockified, so the used display is `flex`. Either way it is a flex box that
    // keeps the label and any leading glyph on one baseline.
    const crumb = query(host, '.cngx-breadcrumb__crumb');
    expect(computedValue(crumb, 'display')).toBe('flex');
    expect(computedValue(crumb, 'align-items')).toBe('center');
  });

  it('derives the list gap from the --cngx-space scale', () => {
    // `.cngx-breadcrumb` SETs `--cngx-breadcrumb-gap: var(--cngx-space-sm)` and
    // the list reads it, so driving the scale on the host mimics what a
    // `[data-density]` ancestor does. jsdom cannot resolve the used gap.
    const host = mount();
    const list = query(host, '.cngx-breadcrumb__list');
    host.style.setProperty('--cngx-space-sm', '4px');
    expect(computedValue(list, 'column-gap')).toBe('4px');
    host.style.setProperty('--cngx-space-sm', '16px');
    expect(computedValue(list, 'column-gap')).toBe('16px');
  });
});

describe('CngxBreadcrumbBar ribbon clip-path direction', () => {
  // Pin the exact reflected polygons: an inequality-only assertion would pass
  // for any wrong-but-different reflection. These are the computed (browser-
  // serialized) forms of the authored mid/cap polygons and their x -> 100% - x
  // mirrors.
  const MID_LTR =
    'polygon(0px 0px, calc(100% - 12px) 0px, 100% 50%, calc(100% - 12px) 100%, 0px 100%, 12px 50%)';
  const MID_RTL =
    'polygon(100% 0px, 12px 0px, 0px 50%, 12px 100%, 100% 100%, calc(100% - 12px) 50%)';
  const CAP_LTR =
    'polygon(0px 0px, calc(100% - 12px) 0px, 100% 50%, calc(100% - 12px) 100%, 0px 100%)';
  const CAP_RTL = 'polygon(100% 0px, 12px 0px, 0px 50%, 12px 100%, 100% 100%)';

  it('reflects the mid-crumb silhouette under dir=rtl and keeps LTR byte-stable', () => {
    const host = mountRibbon();
    const link = query(host, '.cngx-breadcrumb__crumb:not(:first-child) .cngx-breadcrumb__link');
    expect(computedValue(link, 'clip-path')).toBe(MID_LTR);

    document.documentElement.dir = 'rtl';
    expect(computedValue(link, 'clip-path')).toBe(MID_RTL);

    document.documentElement.dir = 'ltr';
    expect(computedValue(link, 'clip-path')).toBe(MID_LTR);
  });

  it('reflects the first-crumb cap silhouette and its rounded edge under dir=rtl', () => {
    const host = mountRibbon();
    // Pin the radius so the mirrored border-radius is asserted against a known
    // value rather than the resolved `--cngx-radius-sm` fallback.
    host.style.setProperty('--cngx-breadcrumb-ribbon-radius', '8px');
    const cap = query(host, '.cngx-breadcrumb__crumb:first-child .cngx-breadcrumb__link');
    expect(computedValue(cap, 'clip-path')).toBe(CAP_LTR);
    expect(computedValue(cap, 'border-radius')).toBe('8px 0px 0px 8px');

    document.documentElement.dir = 'rtl';
    expect(computedValue(cap, 'clip-path')).toBe(CAP_RTL);
    // The rounded corners follow the flat edge to the inline-end side.
    expect(computedValue(cap, 'border-radius')).toBe('0px 8px 8px 0px');
  });
});

describe('CngxBreadcrumbBar separator glyph direction', () => {
  function separatorContent(host: HTMLElement): string {
    const sep = host.querySelector('.cngx-breadcrumb__separator');
    if (!sep) {
      throw new Error('.cngx-breadcrumb__separator did not render');
    }
    // The token lives on the ::after use-site, not the element, so read the
    // pseudo directly - computedValue() only reads the element itself.
    return getComputedStyle(sep, '::after').getPropertyValue('content').trim();
  }

  it('flips the routed separator glyph from › to ‹ under dir=rtl, LTR stable', () => {
    const host = mountHeader();
    const ltr = separatorContent(host);
    expect(ltr).toContain('›');

    document.documentElement.dir = 'rtl';
    const rtl = separatorContent(host);
    expect(rtl).toContain('‹');
    expect(rtl).not.toBe(ltr);

    document.documentElement.dir = 'ltr';
    expect(separatorContent(host)).toBe(ltr);
  });
});
