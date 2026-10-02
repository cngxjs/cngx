/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxAvatar } from './avatar.component';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors the
// avatar plate and its status dot are painted with background only, so the plate
// vanished and the four presence states collapsed into identical rings. The plate
// now keeps an inset CanvasText outline and the dot encodes presence by shape:
// online filled, offline hollow, away half filled, busy filled with a Canvas bar.

const SCHEMES = ['light', 'dark'] as const;
const STATES = ['online', 'offline', 'away', 'busy'] as const;

@Component({
  selector: 'cngx-avatar-forced-host',
  standalone: true,
  imports: [CngxAvatar],
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-avatar class="av-online" initials="AO" status="online" />
    <cngx-avatar class="av-offline" initials="BO" status="offline" />
    <cngx-avatar class="av-away" initials="CA" status="away" />
    <cngx-avatar class="av-busy" initials="DB" status="busy" />
    <cngx-avatar class="av-square" initials="ES" shape="square" />
    <cngx-avatar class="av-big" initials="FB" status="online" />
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span
      class="probe-online"
      style="color: var(--cngx-avatar-status-online, var(--cngx-color-success, oklch(0.68 0.18 145)))"
    ></span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
  `,
})
class AvatarHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AvatarHost);
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

const dot = (root: HTMLElement, state: string): HTMLElement => one(root, `.av-${state} .cngx-avatar__status`);
const px = (value: string): number => Number.parseFloat(value);

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('avatar under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string => computedValue(one(root, `.probe-${name}`), 'color');

  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(probe(root, 'canvastext'));
  });

  it('keeps the plate shape with an inset CanvasText outline', async () => {
    const root = await mountForced();
    for (const plate of ['.av-online', '.av-square']) {
      const host = one(root, plate);
      expect(computedValue(host, 'outline-style')).toBe('solid');
      expect(computedValue(host, 'outline-color')).toBe(probe(root, 'canvastext'));
      expect(px(computedValue(host, 'outline-offset'))).toBe(-1);
    }
  });

  it('paints every dot in system colours on a Canvas ring at 0.8em', async () => {
    const root = await mountForced();
    for (const state of STATES) {
      const el = dot(root, state);
      expect(computedValue(el, 'forced-color-adjust')).toBe('none');
      expect(computedValue(el, 'border-top-color')).toBe(probe(root, 'canvas'));
      expect(px(computedValue(el, 'width'))).toBeCloseTo(px(computedValue(one(root, '.av-online'), 'font-size')) * 0.8, 1);
    }
  });

  it('keeps a larger consumer dot size instead of shrinking it to 0.8em', async () => {
    const root = await mountForced();
    const big = dot(root, 'big');
    big.style.setProperty('--cngx-avatar-status-size', '1.2em');
    expect(px(computedValue(big, 'width'))).toBeCloseTo(px(computedValue(one(root, '.av-big'), 'font-size')) * 1.2, 1);
  });

  it('encodes each presence state by shape', async () => {
    const root = await mountForced();
    const ink = probe(root, 'canvastext');
    const canvas = probe(root, 'canvas');

    expect(computedValue(dot(root, 'online'), 'background-color')).toBe(ink);
    expect(computedValue(dot(root, 'online'), 'background-image')).toBe('none');

    expect(computedValue(dot(root, 'offline'), 'background-color')).toBe(canvas);
    expect(computedValue(dot(root, 'offline'), 'box-shadow')).toContain(ink);

    const away = computedValue(dot(root, 'away'), 'background-image');
    expect(away).toContain('linear-gradient');
    expect(away).toContain(ink);
    expect(away).toContain(canvas);
    expect(computedValue(dot(root, 'away'), 'box-shadow')).toContain(ink);

    expect(computedValue(dot(root, 'busy'), 'background-color')).toBe(ink);
    expect(computedValue(dot(root, 'busy'), 'background-image')).toContain(canvas);
  });

  it('never paints two presence states alike', async () => {
    const root = await mountForced();
    const paint = STATES.map((state) => {
      const el = dot(root, state);
      return ['background-color', 'background-image', 'box-shadow'].map((p) => computedValue(el, p)).join('|');
    });
    expect(new Set(paint).size).toBe(STATES.length);
  });
});

describe('avatar without forced colors', () => {
  it('keeps the author paint: no outline, coloured dot at 0.65em, no ring', () => {
    const root = mount();
    expect(computedValue(one(root, '.av-online'), 'outline-style')).toBe('none');
    const online = dot(root, 'online');
    expect(computedValue(online, 'background-color')).toBe(computedValue(one(root, '.probe-online'), 'color'));
    expect(computedValue(online, 'box-shadow')).toBe('none');
    expect(px(computedValue(online, 'width'))).toBeCloseTo(px(computedValue(one(root, '.av-online'), 'font-size')) * 0.65, 1);
  });
});
