import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxNavGroup, CngxNavIcon, CngxNavLink } from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxNavRail } from './nav-rail';

// Runs in a real Chromium (the `test-geometry` target) against the
// working-tree nav-rail bridge (`./nav-rail-material.spec-host.scss`). Under
// an M3 theme `cngx-nav-rail` is the M3 navigation rail: 80px wide in both
// looks; icon only, a row is the 56px round indicator; with labels below, a
// 56px destination with the 56 x 32 indicator pill behind the icon and a
// label-medium label under it.

const ICON = `<span style="display:block;inline-size:100%;block-size:100%;background:currentColor"></span>`;

@Component({
  selector: 'cngx-nav-rail-material-host',
  standalone: true,
  imports: [CngxNavRail, CngxNavLink, CngxNavIcon, CngxNavGroup],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/density-tokens.css',
    '../../common/theming/components/cngx-nav.css',
    '../../common/theming/components/cngx-tooltip.css',
    './nav-rail.css',
    './nav-rail-material.spec-host.scss',
  ],
  // Unlayered, so state reads never land mid-transition.
  styles: [
    '.frame { display: flex; block-size: 320px; }',
    '.frame :is(.cngx-nav-link, .cngx-nav-group), .frame :is(.cngx-nav-link, .cngx-nav-group)::after { transition: none; }',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="frame">
      <cngx-nav-rail class="rail-end" labelPlacement="end" [tooltip]="false" ariaLabel="End">
        <a cngxNavLink href="#inbox" class="end-active" [active]="true">
          <span cngxNavIcon class="end-icon">${ICON}</span>Inbox
        </a>
      </cngx-nav-rail>
      <cngx-nav-rail class="rail-below" labelPlacement="below" ariaLabel="Below">
        <a cngxNavLink href="#inbox" class="below-active" [active]="true">
          <span cngxNavIcon class="below-icon">${ICON}</span>Inbox
        </a>
        <a cngxNavLink href="#drafts" class="below-idle">
          <span cngxNavIcon>${ICON}</span>Drafts
        </a>
        <button type="button" cngxNavGroup class="below-group">
          <span cngxNavIcon>${ICON}</span>Reports
        </button>
      </cngx-nav-rail>
      <div dir="rtl" style="display: flex">
        <cngx-nav-rail labelPlacement="below" ariaLabel="Right to left">
          <a cngxNavLink href="#inbox" class="rtl-active" [active]="true">
            <span cngxNavIcon class="rtl-icon">${ICON}</span>Inbox
          </a>
        </cngx-nav-rail>
      </div>
      <div data-density="compact" style="display: flex">
        <cngx-nav-rail labelPlacement="below" ariaLabel="Compact">
          <a cngxNavLink href="#inbox" class="compact-row">
            <span cngxNavIcon>${ICON}</span>Inbox
          </a>
        </cngx-nav-rail>
      </div>
    </div>
    <span class="probe-active" style="background-color: var(--mat-sys-secondary-container)"></span>
  `,
})
class NavRailMaterialHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(NavRailMaterialHost);
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

const box = (root: ParentNode, selector: string): DOMRect =>
  one(root, selector).getBoundingClientRect();

const pill = (el: Element): CSSStyleDeclaration => getComputedStyle(el, '::after');

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('nav rail under the M3 bridge', () => {
  it('is 80px wide with no divider in both looks', () => {
    const root = mount();
    expect(box(root, '.rail-end').width).toBe(80);
    expect(box(root, '.rail-below').width).toBe(80);
    expect(computedValue(one(root, '.rail-end'), 'border-right-width')).toBe('0px');
  });

  it('draws an icon-only row as the 56px round indicator, centred in the rail', () => {
    const root = mount();
    const row = box(root, '.end-active');
    expect(row.width).toBe(56);
    expect(row.height).toBe(56);
    expect(computedValue(one(root, '.end-active'), 'border-top-left-radius')).toBe('9999px');
    const rail = box(root, '.rail-end');
    const icon = box(root, '.end-icon');
    expect(icon.width).toBe(24);
    expect(Math.abs(icon.x + icon.width / 2 - (rail.x + rail.width / 2))).toBeLessThan(0.5);
  });

  it('makes a labelled destination 56px high across the full rail width', () => {
    const root = mount();
    for (const selector of ['.below-active', '.below-idle', '.below-group']) {
      expect(box(root, selector).height).toBe(56);
      expect(box(root, selector).width).toBe(80);
    }
  });

  it('paints the active indicator as a 56 x 32 pill behind the icon, not as the row fill', () => {
    const root = mount();
    const row = one(root, '.below-active');
    expect(computedValue(row, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    const indicator = pill(row);
    expect(indicator.width).toBe('56px');
    expect(indicator.height).toBe('32px');
    expect(indicator.borderTopLeftRadius).toBe('9999px');
    expect(indicator.backgroundColor).toBe(
      computedValue(one(root, '.probe-active'), 'background-color'),
    );
    expect(pill(one(root, '.below-idle')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  for (const [rowSelector, iconSelector] of [
    ['.below-active', '.below-icon'],
    ['.rtl-active', '.rtl-icon'],
  ] as const) {
    it(`centres the pill on the icon with 16px beside it and 4px above it (${rowSelector})`, () => {
      const root = mount();
      const row = box(root, rowSelector);
      const icon = box(root, iconSelector);
      const pillLeft = row.x + (row.width - 56) / 2;
      expect(Math.abs(icon.x - pillLeft - 16)).toBeLessThan(0.5);
      expect(Math.abs(icon.y - row.y - 4)).toBeLessThan(0.5);
    });
  }

  it('sets the label in label-medium: 12px on a 16px line, 500 at rest and 700 when active', () => {
    const root = mount();
    const idle = one(root, '.below-idle');
    expect(computedValue(idle, 'font-size')).toBe('12px');
    expect(computedValue(idle, 'line-height')).toBe('16px');
    expect(computedValue(idle, 'font-weight')).toBe('500');
    expect(computedValue(one(root, '.below-active'), 'font-weight')).toBe('700');
  });

  it('shrinks the destination with the spacing scale in a compact island', () => {
    const root = mount();
    // 2 * 2px padding + 24px icon + 4px gap + 16px label.
    expect(box(root, '.compact-row').height).toBe(48);
  });
});
