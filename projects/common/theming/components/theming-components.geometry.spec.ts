import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio, parkPointer, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). These five files are
// Track-B: they ship in the aggregated `cngx.css`, not on any component
// styleUrl. Each host below loads the exact file via `styleUrls` under
// `ViewEncapsulation.None` to exercise the real `@scope` block. One geometry
// spec in theming/components/ guards every layout-bearing stylesheet in the
// folder. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

function mount<T>(type: new () => T, selector: string): HTMLElement {
  const fixture = TestBed.createComponent(type);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = (mountedRoot.matches(selector) ? mountedRoot : mountedRoot.querySelector(selector)) as
    | HTMLElement
    | null;
  if (!host) {
    throw new Error(`${selector} did not render`);
  }
  return host;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

// ── cngx-backdrop.css ──────────────────────────────────────────────────────

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-backdrop.css'],
  template: `
    <div class="cngx-backdrop"></div>
    <div class="cngx-backdrop cngx-backdrop--visible"></div>
  `,
})
class BackdropHost {}

describe('CngxBackdrop geometry (Track-B)', () => {
  it('is a full-viewport fixed scrim, click-through until visible', () => {
    const fixture = TestBed.createComponent(BackdropHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const [idle, visible] = Array.from(
      mountedRoot.querySelectorAll('.cngx-backdrop'),
    ) as HTMLElement[];
    expect(computedValue(idle, 'position')).toBe('fixed');
    expect(computedValue(idle, 'top')).toBe('0px');
    // Idle: transparent + click-through; --visible: opaque + interactive.
    expect(computedValue(idle, 'opacity')).toBe('0');
    expect(computedValue(idle, 'pointer-events')).toBe('none');
    expect(computedValue(visible, 'opacity')).toBe('1');
    expect(computedValue(visible, 'pointer-events')).toBe('auto');
  });
});

// ── cngx-drawer.css ────────────────────────────────────────────────────────

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-drawer.css'],
  template: `
    <div class="cngx-drawer drawer-idle">
      <nav class="cngx-drawer-panel cngx-drawer-panel--modal"></nav>
    </div>
    <div class="cngx-drawer drawer-modal">
      <nav class="cngx-drawer-panel cngx-drawer-panel--modal cngx-drawer-panel--open"></nav>
    </div>
    <div class="cngx-drawer drawer-none">
      <nav class="cngx-drawer-panel cngx-drawer-panel--open"></nav>
    </div>
  `,
})
class DrawerScrimHost {}

describe('CngxDrawer scrim geometry (Track-B)', () => {
  it('covers the host and shows only while a modal panel is open', () => {
    const fixture = TestBed.createComponent(DrawerScrimHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const host = (sel: string) => mountedRoot?.querySelector(sel) as HTMLElement;
    const scrim = (sel: string) => getComputedStyle(host(sel), '::after');

    expect(computedValue(host('.drawer-idle'), 'position')).toBe('relative');
    expect(scrim('.drawer-idle').position).toBe('absolute');
    expect(scrim('.drawer-idle').top).toBe('0px');
    expect(scrim('.drawer-idle').opacity).toBe('0');
    expect(scrim('.drawer-idle').pointerEvents).toBe('none');
    expect(scrim('.drawer-modal').opacity).toBe('1');
    expect(scrim('.drawer-modal').pointerEvents).toBe('auto');
    expect(scrim('.drawer-none').opacity).toBe('0');
  });
});

// ── cngx-badge.css ─────────────────────────────────────────────────────────

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-badge.css'],
  template: `<span class="cngx-badge-indicator cngx-badge-indicator--above-end">5</span>`,
})
class BadgeHost {}

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-badge.css'],
  template: `
    <div class="badges">
      <span class="cngx-badge-indicator cngx-badge-indicator--primary badge-default">1</span>
      <div style="--cngx-color-primary: oklch(0.55 0.15 250)">
        <span class="cngx-badge-indicator cngx-badge-indicator--primary badge-branded">2</span>
      </div>
    </div>
  `,
})
class PrimaryBadgeHost {}

describe('CngxBadge geometry (Track-B)', () => {
  it('centres the count in a corner-anchored pill', () => {
    const host = mount(BadgeHost, '.cngx-badge-indicator');
    // Authored inline-flex; the above-end variant is position:absolute, which
    // blockifies the used display to flex.
    expect(computedValue(host, 'display')).toMatch(/flex/);
    expect(computedValue(host, 'align-items')).toBe('center');
    expect(computedValue(host, 'justify-content')).toBe('center');
    // min-width tracks --cngx-badge-size (registered 16px initial).
    expect(computedValue(host, 'min-width')).toBe('16px');
    // The above-end variant anchors the pill absolutely off the host corner.
    expect(computedValue(host, 'position')).toBe('absolute');
  });

  it('isolates the count run under dir=rtl (bucket A, isolate only)', () => {
    document.documentElement.dir = 'rtl';
    const host = mount(BadgeHost, '.cngx-badge-indicator');
    // Single self-contained count (`"99+"`); isolate fences the bidi boundary
    // without forcing a direction, so RTL-locale digits keep their own order.
    expect(computedValue(host, 'unicode-bidi')).toBe('isolate');
  });

  // The primary variant falls back to the primary at the use site; a
  // registered initial-value would shadow that fallback and paint Ember under
  // any brand.
  it('paints the primary variant with the primary in scope', () => {
    const root = mount(PrimaryBadgeHost, '.badges');
    const fill = (selector: string): string =>
      computedValue(root.querySelector(selector) as HTMLElement, 'background-color');
    expect(rasterise(fill('.badge-branded'))).toEqual(rasterise('oklch(0.55 0.15 250)'));
    expect(rasterise(fill('.badge-default'))).toEqual(rasterise('oklch(0.66 0.19 50)'));
  });
});

// ── cngx-button-toggle.css ─────────────────────────────────────────────────

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-button-toggle.css'],
  template: `<button class="cngx-button-toggle">Grid</button>`,
})
class ButtonToggleHost {}

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-button-toggle.css'],
  template: `<button class="cngx-button-toggle cngx-button-toggle--checked">Grid</button>`,
})
class CheckedButtonToggleHost {}

function lightness(el: HTMLElement): number {
  const match = /okl(?:ch|ab)\(([\d.]+)/.exec(getComputedStyle(el).backgroundColor);
  if (!match) {
    throw new Error(`no oklch/oklab background: ${getComputedStyle(el).backgroundColor}`);
  }
  return Number(match[1]);
}

describe('CngxButtonToggle geometry (Track-B)', () => {
  it('is a centred inline-flex segment with a floored tap height', () => {
    const host = mount(ButtonToggleHost, '.cngx-button-toggle');
    expect(computedValue(host, 'display')).toBe('inline-flex');
    expect(computedValue(host, 'justify-content')).toBe('center');
    // Padding derives from the scale; the block axis floors off --cngx-target-min.
    host.style.setProperty('--cngx-space-md', '20px');
    expect(computedValue(host, 'padding-left')).toBe('20px');
    host.style.setProperty('--cngx-target-min', '44px');
    expect(computedValue(host, 'min-block-size')).toBe('44px');
  });

  // The checked hover shades the fill away from the on-primary-strong ink: darker
  // under the default near-white ink, lighter under a dark ink.
  it('shades the checked hover away from its ink', async () => {
    const host = mount(CheckedButtonToggleHost, '.cngx-button-toggle');
    host.style.transition = 'none';
    const rest = lightness(host);
    await userEvent.hover(host);
    expect(lightness(host)).toBeLessThan(rest);
    host.style.setProperty('--cngx-color-on-primary-strong', 'oklch(0.2 0 0)');
    expect(lightness(host)).toBeGreaterThan(rest);
    await userEvent.unhover(host);
  });
});

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    './cngx-button-toggle.css',
  ],
  template: `
    @for (scheme of schemes; track scheme) {
      <p [attr.data-color-scheme]="scheme">
        <button class="cngx-button-toggle cngx-button-toggle--checked toggle-{{ scheme }}">
          Grid
        </button>
      </p>
    }
  `,
})
class CheckedToggleContrastHost {
  protected readonly schemes = ['light', 'dark'] as const;
}

describe('CngxButtonToggle checked label contrast (default palette)', () => {
  it.each([
    ['light', 'rest'],
    ['light', 'hover'],
    ['dark', 'rest'],
    ['dark', 'hover'],
  ] as const)('a checked segment in the %s scheme clears 4.5:1 at %s', async (scheme, state) => {
    const host = mount(CheckedToggleContrastHost, `.toggle-${scheme}`);
    host.style.transition = 'none';
    if (state === 'hover') {
      await userEvent.hover(host);
    }
    const ratio = contrastRatio(
      computedValue(host, 'color'),
      computedValue(host, 'background-color'),
    );
    await parkPointer();
    expect(ratio, `${scheme} / ${state}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});

// ── cngx-ripple.css ────────────────────────────────────────────────────────

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-ripple.css'],
  template: `<span class="cngx-ripple__wave"></span>`,
})
class RippleHost {}

describe('CngxRipple geometry (Track-B)', () => {
  it('is an absolutely-positioned round wave sized by the per-event token', () => {
    const host = mount(RippleHost, '.cngx-ripple__wave');
    expect(computedValue(host, 'position')).toBe('absolute');
    expect(computedValue(host, 'border-radius')).toBe('50%');
    // The directive sets --cngx-ripple-size per pointer event; the wave tracks it.
    host.style.setProperty('--cngx-ripple-size', '80px');
    expect(computedValue(host, 'width')).toBe('80px');
    expect(computedValue(host, 'height')).toBe('80px');
  });
});

// ── cngx-tooltip.css ───────────────────────────────────────────────────────

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-tooltip.css'],
  template: `<div class="cngx-tooltip">Tip</div>`,
})
class TooltipHost {}

describe('CngxTooltip geometry (Track-B)', () => {
  it('is a fixed, width-capped pill with scale-derived padding', () => {
    const host = mount(TooltipHost, '.cngx-tooltip');
    expect(computedValue(host, 'position')).toBe('fixed');
    // max-width tracks --cngx-tooltip-max-width (registered 200px initial).
    expect(computedValue(host, 'max-width')).toBe('200px');
    host.style.setProperty('--cngx-space-sm', '10px');
    expect(computedValue(host, 'padding-left')).toBe('10px');
  });
});
