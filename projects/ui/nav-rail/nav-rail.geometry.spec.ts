import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CngxNavGroup,
  CngxNavGroupContent,
  CngxNavIcon,
  CngxNavLink,
} from '@cngx/common/interactive';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxNavRail, type CngxNavRailLabelPlacement } from './nav-rail';

// Runs in a real Chromium (the `test-geometry` target): the rail width, the
// clipped label and the anchored flyout are layout facts jsdom cannot see.

@Component({
  selector: 'cngx-nav-rail-geometry-host',
  standalone: true,
  imports: [CngxNavRail, CngxNavLink, CngxNavIcon, CngxNavGroup, CngxNavGroupContent],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../common/theming/components/cngx-nav.css',
    './nav-rail.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="block-size: 400px; display: flex">
      <cngx-nav-rail [labelPlacement]="placement()">
        <a cngxNavLink href="#inbox" class="row">
          <span cngxNavIcon class="icon"
            ><span
              style="display:block;inline-size:100%;block-size:100%;background:currentColor"
            ></span
          ></span>
          <span class="label">Inbox</span>
        </a>
        <button type="button" cngxNavGroup #reports="cngxNavGroup" class="head">
          <span cngxNavIcon
            ><span
              style="display:block;inline-size:100%;block-size:100%;background:currentColor"
            ></span
          ></span>
          Reports
        </button>
        <div [cngxNavGroupContent]="reports" class="flyout">
          <div>
            <a cngxNavLink href="#weekly" [depth]="1">Weekly</a>
            <a cngxNavLink href="#monthly" [depth]="1">Monthly</a>
          </div>
        </div>
      </cngx-nav-rail>
    </div>
  `,
})
class RailGeometryHost {
  readonly placement = signal<CngxNavRailLabelPlacement>('end');
}

let mountedRoot: HTMLElement | null = null;

function mount(placement: CngxNavRailLabelPlacement = 'end') {
  const fixture = TestBed.createComponent(RailGeometryHost);
  fixture.componentInstance.placement.set(placement);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  const el = (selector: string) => mountedRoot!.querySelector<HTMLElement>(selector)!;
  return { fixture, el };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxNavRail geometry', () => {
  it('centres the icon box in the icon-only rail', () => {
    const { el } = mount('end');
    const rail = el('cngx-nav-rail').getBoundingClientRect();
    const icon = el('.icon').getBoundingClientRect();
    const left = icon.left - rail.left;
    const right = rail.right - icon.right;
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1.5);
  });

  it('paints no label pixels in the icon-only rail', () => {
    const { el } = mount('end');
    const row = el('.row').getBoundingClientRect();
    const label = el('.label').getBoundingClientRect();
    expect(label.left).toBeGreaterThanOrEqual(row.right - 0.5);
  });

  it('stacks the label under a centred icon in the label-below rail', () => {
    const { el } = mount('below');
    const rail = el('cngx-nav-rail').getBoundingClientRect();
    const icon = el('.icon').getBoundingClientRect();
    const label = el('.label').getBoundingClientRect();
    expect(label.top).toBeGreaterThanOrEqual(icon.bottom - 0.5);
    const iconCentre = (icon.left + icon.right) / 2;
    const railCentre = (rail.left + rail.right) / 2;
    expect(Math.abs(iconCentre - railCentre)).toBeLessThanOrEqual(1.5);
    expect(label.right).toBeLessThanOrEqual(rail.right + 0.5);
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    it(`opens the flyout beside the head, inside the viewport (${dir})`, async () => {
      document.documentElement.setAttribute('dir', dir);
      const { fixture, el } = mount('end');
      el('.head').click();
      fixture.detectChanges();
      TestBed.flushEffects();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const flyout = el('.flyout');
      expect(flyout.matches(':popover-open')).toBe(true);
      const box = flyout.getBoundingClientRect();
      const rail = el('cngx-nav-rail').getBoundingClientRect();
      expect(box.width).toBeGreaterThan(0);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(window.innerWidth);
      if (dir === 'ltr') {
        expect(box.left).toBeGreaterThanOrEqual(rail.right - 0.5);
      } else {
        expect(box.right).toBeLessThanOrEqual(rail.left + 0.5);
      }
    });
  }
});
