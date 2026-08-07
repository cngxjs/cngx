import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStatValue } from '@cngx/common/data';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStatCard } from './stat-card.component';
import { CngxStatCardFooter } from './stat-card-slots';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-stat-card)` block SETs (stat-card.component.css): the host is a
// positioning context (so the refresh indicator can sit out of flow), the
// content view is a centred vertical flex column that reserves a fixed body
// min-height so a skeleton -> content swap never resizes the tile in a dashboard
// grid, and the value row shares a baseline. With no `[state]` the card resolves
// to its content view. jsdom reports `''` for every one of these reads.

@Component({
  selector: 'cngx-stat-card-geometry-host',
  standalone: true,
  imports: [CngxStatCard, CngxStatValue, CngxStatCardFooter],
  template: `
    <cngx-stat-card>
      <span cngxStatValue>1.2M</span>
      <span cngxStatCardFooter>updated now</span>
    </cngx-stat-card>
  `,
})
class StatCardHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(StatCardHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-stat-card');
  if (!host) {
    throw new Error('cngx-stat-card did not render');
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

describe('CngxStatCard geometry', () => {
  it('renders the host as a positioned block', () => {
    // position: relative is the anchor the out-of-flow refresh indicator resolves
    // against; without it the indicator would escape the tile.
    const host = mount();
    expect(computedValue(host, 'display')).toBe('block');
    expect(computedValue(host, 'position')).toBe('relative');
  });

  it('lays the content view out as a centred vertical flex column with a reserved body height', () => {
    const host = mount();
    const stat = query(host, '.cngx-stat-card__stat');
    expect(computedValue(stat, 'display')).toBe('flex');
    expect(computedValue(stat, 'flex-direction')).toBe('column');
    expect(computedValue(stat, 'justify-content')).toBe('center');
    // Every view branch reserves --cngx-stat-card-body-min-height (6rem == 96px at
    // the 16px root), so a refresh does not reflow the dashboard grid.
    expect(computedValue(stat, 'min-block-size')).toBe('96px');
  });

  it('shares a baseline across the value row', () => {
    const host = mount();
    const row = query(host, '.cngx-stat-card__row');
    expect(computedValue(row, 'display')).toBe('flex');
    expect(computedValue(row, 'align-items')).toBe('baseline');
  });
});
