import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxNavGroup, CngxNavIcon, CngxNavLink } from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';

// Runs in a real Chromium (the `test-geometry` target) against the
// working-tree sidenav and nav-link bridges
// (`./sidenav-material-metrics.spec-host.scss`). Under an M3 theme a sidenav
// row is the M3 navigation drawer item: 56px high at density 0, a full pill,
// 16px start and 24px end padding, a 24px icon 12px from the label, 12px from
// the drawer edge, label-large at 500 and the prominent 700 when active. The
// metrics ride the --cngx-space-* scale, so a Material density theme and a
// cngx [data-density] island both re-scale them.

const MATERIAL_DENSITIES = [
  ['0', 56],
  ['-1', 52],
  ['-2', 48],
  ['-3', 44],
  ['-4', 40],
] as const;

const CNGX_DENSITIES = [
  ['compact', 40],
  ['spacious', 64],
] as const;

@Component({
  selector: 'cngx-sidenav-material-metrics-host',
  standalone: true,
  imports: [CngxSidenav, CngxNavLink, CngxNavGroup, CngxNavIcon],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/density-tokens.css',
    '../../common/theming/components/cngx-nav.css',
    './sidenav-material-metrics.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (density of materialDensities; track density[0]) {
      <div [class]="density[0] === '0' ? '' : 'material-density' + density[0]">
        <cngx-sidenav mode="side" [opened]="true" ariaLabel="Material {{ density[0] }}">
          <a cngxNavLink href="#inbox" class="row-m{{ density[0] }}" [active]="true">
            <span cngxNavIcon class="icon-m{{ density[0] }}">*</span>Inbox
          </a>
          <a cngxNavLink href="#drafts" class="idle-m{{ density[0] }}">Drafts</a>
          <button type="button" cngxNavGroup class="group-m{{ density[0] }}">Settings</button>
        </cngx-sidenav>
      </div>
    }
    @for (density of cngxDensities; track density[0]) {
      <div [attr.data-density]="density[0]">
        <cngx-sidenav mode="side" [opened]="true" ariaLabel="cngx {{ density[0] }}">
          <a cngxNavLink href="#inbox" class="row-{{ density[0] }}">Inbox</a>
        </cngx-sidenav>
      </div>
    }
  `,
})
class SidenavMaterialMetricsHost {
  readonly materialDensities = MATERIAL_DENSITIES;
  readonly cngxDensities = CNGX_DENSITIES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SidenavMaterialMetricsHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

const height = (root: ParentNode, selector: string): number =>
  one(root, selector).getBoundingClientRect().height;

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('sidenav rows under the M3 bridge', () => {
  for (const [density, rowHeight] of MATERIAL_DENSITIES) {
    it(`renders link, letter and group rows ${rowHeight}px high at Material density ${density}`, () => {
      const root = mount();
      expect(height(root, `.row-m${density}`)).toBe(rowHeight);
      expect(height(root, `.idle-m${density}`)).toBe(rowHeight);
      expect(height(root, `.group-m${density}`)).toBe(rowHeight);
    });
  }

  for (const [density, rowHeight] of CNGX_DENSITIES) {
    it(`renders a ${rowHeight}px row in a cngx ${density} island`, () => {
      const root = mount();
      expect(height(root, `.row-${density}`)).toBe(rowHeight);
    });
  }

  it('draws the row as a full pill', () => {
    const row = one(mount(), '.row-m0');
    expect(computedValue(row, 'border-top-left-radius')).toBe('9999px');
    expect(computedValue(row, 'border-bottom-right-radius')).toBe('9999px');
  });

  it('pads 16px at the start and 24px at the end, 12px in from the drawer edge', () => {
    const row = one(mount(), '.row-m0');
    expect(computedValue(row, 'padding-left')).toBe('16px');
    expect(computedValue(row, 'padding-right')).toBe('24px');
    expect(computedValue(row, 'margin-left')).toBe('12px');
    expect(computedValue(row, 'margin-right')).toBe('12px');
  });

  it('sizes the icon box to 24px with a 12px gap to the label', () => {
    const root = mount();
    const icon = one(root, '.icon-m0').getBoundingClientRect();
    expect(icon.width).toBe(24);
    expect(icon.height).toBe(24);
    expect(computedValue(one(root, '.row-m0'), 'column-gap')).toBe('12px');
  });

  it('sets the label-large role: 14px on a 20px line, 500 at rest and 700 when active', () => {
    const root = mount();
    const idle = one(root, '.idle-m0');
    expect(computedValue(idle, 'font-size')).toBe('14px');
    expect(computedValue(idle, 'line-height')).toBe('20px');
    expect(computedValue(idle, 'font-weight')).toBe('500');
    expect(computedValue(one(root, '.group-m0'), 'font-weight')).toBe('500');
    expect(computedValue(one(root, '.row-m0'), 'font-weight')).toBe('700');
  });
});
