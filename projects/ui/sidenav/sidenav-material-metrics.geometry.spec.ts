import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CngxNavGroup,
  CngxNavGroupContent,
  CngxNavIcon,
  CngxNavLink,
} from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';

// Runs in a real Chromium (the `test-geometry` target) against the
// working-tree sidenav and nav-link bridges
// (`./sidenav-material-metrics.spec-host.scss`). Under an M3 theme a sidenav
// row is the M3 list item of mat-nav-list: 48px high at density 0 with no gap
// between rows, a full pill edge to edge, 16px start and end padding, a 24px
// icon 16px from the label, body-large at one weight, the label on-surface and
// the icon on-surface-variant. The metrics ride the --cngx-space-* scale, so a
// Material density theme and a cngx [data-density] island both re-scale them;
// the row height follows Material density step for step.

const MATERIAL_DENSITIES = [
  ['0', 48],
  ['-1', 44],
  ['-2', 40],
  ['-3', 36],
  ['-4', 32],
] as const;

const CNGX_DENSITIES = [
  ['compact', 32],
  ['spacious', 56],
] as const;

@Component({
  selector: 'cngx-sidenav-material-metrics-host',
  standalone: true,
  imports: [CngxSidenav, CngxNavLink, CngxNavGroup, CngxNavGroupContent, CngxNavIcon],
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
    <cngx-sidenav mode="side" [collapsed]="true" [expandOnHover]="false" ariaLabel="Material rail">
      <a cngxNavLink href="#inbox">Inbox</a>
      <button type="button" cngxNavGroup #railGroup="cngxNavGroup" class="rail-group">
        Settings
      </button>
      <div [cngxNavGroupContent]="railGroup" class="rail-group-content">
        <a cngxNavLink href="#general" [depth]="1">General</a>
      </div>
    </cngx-sidenav>
    <span class="probe-on-surface" style="color: var(--mat-sys-on-surface)"></span>
    <span class="probe-on-surface-variant" style="color: var(--mat-sys-on-surface-variant)"></span>
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
      const pitch =
        one(root, `.idle-m${density}`).getBoundingClientRect().top -
        one(root, `.row-m${density}`).getBoundingClientRect().top;
      expect(pitch).toBe(rowHeight);
    });
  }

  for (const [density, rowHeight] of CNGX_DENSITIES) {
    it(`renders a ${rowHeight}px row in a cngx ${density} island`, () => {
      const root = mount();
      expect(height(root, `.row-${density}`)).toBe(rowHeight);
    });
  }

  it('keeps no gap before a popover group on the collapsed rail (rows touch, as in mat-nav-list)', () => {
    const root = mount();
    expect(one(root, '.rail-group-content').hasAttribute('popover')).toBe(true);
    expect(getComputedStyle(one(root, '.rail-group')).marginBlockEnd).toBe('0px');
    // the margin reads the row-gap token, so 0 is the bridge, not a missing rule
    one(root, '[aria-label="Material rail"]').style.setProperty('--cngx-sidenav-row-gap', '3px');
    expect(getComputedStyle(one(root, '.rail-group')).marginBlockEnd).toBe('3px');
  });

  it('draws the row as a full pill', () => {
    const row = one(mount(), '.row-m0');
    expect(computedValue(row, 'border-top-left-radius')).toBe('9999px');
    expect(computedValue(row, 'border-bottom-right-radius')).toBe('9999px');
  });

  it('pads 16px at the start and the end, edge to edge', () => {
    const row = one(mount(), '.row-m0');
    expect(computedValue(row, 'padding-left')).toBe('16px');
    expect(computedValue(row, 'padding-right')).toBe('16px');
    expect(computedValue(row, 'margin-left')).toBe('0px');
    expect(computedValue(row, 'margin-right')).toBe('0px');
  });

  it('sizes the icon box to 24px with a 16px gap to the label', () => {
    const root = mount();
    const icon = one(root, '.icon-m0').getBoundingClientRect();
    expect(icon.width).toBe(24);
    expect(icon.height).toBe(24);
    expect(computedValue(one(root, '.row-m0'), 'column-gap')).toBe('16px');
  });

  it('sets the body-large role: 16px on a 24px line, 400 at rest and when active', () => {
    const root = mount();
    const idle = one(root, '.idle-m0');
    expect(computedValue(idle, 'font-size')).toBe('16px');
    expect(computedValue(idle, 'line-height')).toBe('24px');
    expect(computedValue(idle, 'font-weight')).toBe('400');
    expect(computedValue(one(root, '.group-m0'), 'font-weight')).toBe('400');
    expect(computedValue(one(root, '.row-m0'), 'font-weight')).toBe('400');
  });

  it('paints the label on-surface and the icon on-surface-variant, active or not', () => {
    const root = mount();
    const onSurface = computedValue(one(root, '.probe-on-surface'), 'color');
    const variant = computedValue(one(root, '.probe-on-surface-variant'), 'color');
    expect(onSurface).not.toBe(variant);
    expect(computedValue(one(root, '.idle-m0'), 'color')).toBe(onSurface);
    expect(computedValue(one(root, '.row-m0'), 'color')).toBe(onSurface);
    expect(computedValue(one(root, '.icon-m0'), 'color')).toBe(variant);
  });
});
