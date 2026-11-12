import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CngxNavBadge,
  CngxNavGroup,
  CngxNavGroupContent,
  CngxNavIcon,
  CngxNavLabel,
  CngxNavLink,
} from '@cngx/common/interactive';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxNavRail, type CngxNavRailLabelPlacement, type CngxNavRailSide } from './nav-rail';

// Runs in a real Chromium (the `test-geometry` target): the rail width, the
// clipped label and the anchored flyout are layout facts jsdom cannot see.

@Component({
  selector: 'cngx-nav-rail-geometry-host',
  standalone: true,
  imports: [
    CngxNavRail,
    CngxNavLink,
    CngxNavIcon,
    CngxNavBadge,
    CngxNavLabel,
    CngxNavGroup,
    CngxNavGroupContent,
  ],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../common/theming/components/cngx-nav.css',
    '../../common/theming/components/cngx-tooltip.css',
    './nav-rail.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="frame"
      style="block-size: 400px; display: flex"
      [style.justify-content]="side() === 'end' ? 'flex-end' : null"
    >
      <cngx-nav-rail [labelPlacement]="placement()" [side]="side()" style="--cngx-target-min: 44px">
        <div cngxNavLabel class="section">Mail</div>
        <a cngxNavLink href="#inbox" class="row">
          <span cngxNavIcon class="icon"
            ><span
              style="display:block;inline-size:100%;block-size:100%;background:currentColor"
            ></span
          ></span>
          <span class="label">Inbox</span>
          <span cngxNavBadge [value]="7" class="badge"></span>
        </a>
        <button type="button" cngxNavGroup #reports="cngxNavGroup" class="head">
          <span cngxNavIcon class="cngx-icon head-icon"
            ><span
              style="display:block;inline-size:100%;block-size:100%;background:currentColor"
            ></span
          ></span>
          Reports
        </button>
        <div [cngxNavGroupContent]="reports" class="flyout">
          <div>
            <a cngxNavLink href="#weekly" [depth]="1" class="sub">Weekly</a>
            <a cngxNavLink href="#monthly" [depth]="1">Monthly</a>
          </div>
        </div>
      </cngx-nav-rail>
    </div>
  `,
})
class RailGeometryHost {
  readonly placement = signal<CngxNavRailLabelPlacement>('end');
  readonly side = signal<CngxNavRailSide>('start');
}

let mountedRoot: HTMLElement | null = null;

function mount(placement: CngxNavRailLabelPlacement = 'end', side: CngxNavRailSide = 'start') {
  const fixture = TestBed.createComponent(RailGeometryHost);
  fixture.componentInstance.placement.set(placement);
  fixture.componentInstance.side.set(side);
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
  it('draws the border on the inner edge of an end-side rail', () => {
    const { el } = mount('end', 'end');
    const railEl = el('cngx-nav-rail');
    const style = getComputedStyle(railEl);
    expect(style.borderInlineStartWidth).toBe('1px');
    expect(style.borderInlineEndWidth).toBe('0px');
    expect(railEl.getBoundingClientRect().right).toBeCloseTo(
      el('.frame').getBoundingClientRect().right,
      1,
    );
  });

  for (const side of ['start', 'end'] as const) {
    it(`centres the icon box in the icon-only rail, inside its border (${side})`, () => {
      const { el } = mount('end', side);
      const railEl = el('cngx-nav-rail');
      const rail = railEl.getBoundingClientRect();
      const style = getComputedStyle(railEl);
      const icon = el('.icon').getBoundingClientRect();
      const left = icon.left - rail.left - parseFloat(style.borderInlineStartWidth);
      const right = rail.right - parseFloat(style.borderInlineEndWidth) - icon.right;
      expect(Math.abs(left - right)).toBeLessThanOrEqual(0.5);
    });
  }

  it('sizes a cngx-icon in the slot to the icon box, not the row font', () => {
    const { el } = mount('below');
    expect(getComputedStyle(el('.head-icon')).getPropertyValue('--cngx-icon-size').trim()).toBe(
      '1.25rem',
    );
  });

  for (const [side, dir] of [
    ['start', 'ltr'],
    ['start', 'rtl'],
    ['end', 'ltr'],
    ['end', 'rtl'],
  ] as const) {
    it(`keeps the badge whole inside a compact rail (${side}, ${dir})`, () => {
      document.documentElement.setAttribute('dir', dir);
      const { el } = mount('end', side);
      const railEl = el('cngx-nav-rail');
      // The compact density metrics: 8px row padding, 2px row inset.
      railEl.style.setProperty('--cngx-nav-link-padding-inline', '8px');
      railEl.style.setProperty('--cngx-nav-link-inset', '2px');
      const rail = railEl.getBoundingClientRect();
      // The rows end at the rail's inline end; only a start-side rail has its
      // border there (0 for an end-side rail).
      const border = parseFloat(getComputedStyle(railEl).borderInlineEndWidth);
      const badge = el('.badge').getBoundingClientRect();
      const label = el('.label').getBoundingClientRect();
      const row = el('.row').getBoundingClientRect();
      if (dir === 'ltr') {
        expect(badge.right).toBeLessThanOrEqual(rail.right - border + 0.5);
        expect(label.left).toBeGreaterThanOrEqual(badge.right);
      } else {
        expect(badge.left).toBeGreaterThanOrEqual(rail.left + border - 0.5);
        expect(label.right).toBeLessThanOrEqual(badge.left);
      }
      expect(badge.top).toBeGreaterThanOrEqual(row.top);
    });
  }

  it('paints no label pixels in the icon-only rail', () => {
    const { el } = mount('end');
    const row = el('.row').getBoundingClientRect();
    const label = el('.label').getBoundingClientRect();
    // The row clip leaves a badge zone of --cngx-space-lg (24px) past its end;
    // the label starts beyond it.
    expect(label.left).toBeGreaterThanOrEqual(row.right + 24 - 0.5);
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

  it('keeps the badge on the icon corner in the icon-only rail, inside the row', () => {
    const { el } = mount('end');
    const row = el('.row').getBoundingClientRect();
    const icon = el('.icon').getBoundingClientRect();
    const badge = el('.badge').getBoundingClientRect();
    expect(badge.width).toBeGreaterThan(0);
    expect(badge.left).toBeLessThan(icon.right);
    expect(badge.right).toBeGreaterThan(icon.right);
    expect(badge.right).toBeLessThanOrEqual(row.right + 0.5);
    expect(badge.top).toBeLessThan(icon.top + icon.height / 2);
  });

  it('paints no section label text in either look, as a clip and not a colour', () => {
    for (const placement of ['end', 'below'] as const) {
      const { el } = mount(placement);
      expect(getComputedStyle(el('.section')).clipPath).not.toBe('none');
      mountedRoot?.remove();
    }
  });

  it('keeps a stacked row at the touch-target floor', () => {
    const { el } = mount('below');
    expect(el('.row').getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });

  it('shows the label tooltip at the row inline end, past the row edge', async () => {
    const { el } = mount('end');
    // Programmatic focus without a prior pointer press is :focus-visible.
    el('.row').focus();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const tip = el('.cngx-nav-rail-tooltip');
    expect(tip.matches(':popover-open')).toBe(true);
    expect(getComputedStyle(tip).marginInlineStart).toBe('8px');
    expect(tip.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      el('.row').getBoundingClientRect().right + 7.5,
    );
  });

  it('keeps a closed flyout out of the page, with no UA popover box', () => {
    const { el } = mount('end');
    const flyout = el('.flyout');
    expect(flyout.getAttribute('popover')).toBe('manual');
    expect(getComputedStyle(flyout).display).toBe('none');
    expect(flyout.getBoundingClientRect().width).toBe(0);
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

  it('drops the first indent level and steps the padding down for the rows of an open flyout', async () => {
    const { fixture, el } = mount('end');
    el('.head').click();
    fixture.detectChanges();
    TestBed.flushEffects();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(getComputedStyle(el('.sub')).marginInlineStart).toBe('4px');
    expect(getComputedStyle(el('.sub')).paddingInlineStart).toBe('8px');
  });
});
