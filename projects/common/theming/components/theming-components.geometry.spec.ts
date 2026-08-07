import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

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

// ── cngx-badge.css ─────────────────────────────────────────────────────────

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-badge.css'],
  template: `<span class="cngx-badge-indicator cngx-badge-indicator--above-end">5</span>`,
})
class BadgeHost {}

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
});

// ── cngx-button-toggle.css ─────────────────────────────────────────────────

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cngx-button-toggle.css'],
  template: `<button class="cngx-button-toggle">Grid</button>`,
})
class ButtonToggleHost {}

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
