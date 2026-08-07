import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
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
