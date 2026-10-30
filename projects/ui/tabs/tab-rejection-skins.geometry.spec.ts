/// <reference types="@vitest/browser-playwright" />

import { Component, input, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxTab, type CngxTabsCommitAction, type CngxTabsSkin } from '@cngx/common/tabs';
import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxTabGroup } from './tab-group.component';

// Runs in a real Chromium (the `test-geometry` target) with the real tab CSS
// and the foundation tokens. Covers the per-skin error and rejection
// treatment: the alert badge and the rejection icon as bare icons after the
// label, the rejected tab drawn as a tinted surface in the skin's own shape
// (contained, segmented, pill, pill-outline) or by label colour only (line),
// the forced-colors outline, and the icon / label contrast in both schemes.

const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const SKINS = ['line', 'contained', 'segmented', 'pill', 'pill-outline'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;
type Orientation = (typeof ORIENTATIONS)[number];

function stubAggregator(): CngxErrorAggregatorContract {
  return {
    hasError: signal(true),
    errorCount: signal(1),
    activeErrors: signal<readonly string[]>([]),
    errorLabels: signal<readonly string[]>([]),
    shouldShow: signal(true),
    announcement: signal('1 error'),
    addSource: () => {},
    removeSource: () => {},
  };
}

@Component({
  selector: 'cngx-tab-rejection-skin-host',
  standalone: true,
  imports: [CngxTabGroup, CngxTab],
  styleUrls: ['../../core/theming/system-tokens.css'],
  styles: `
    .scheme {
      background: var(--cngx-color-surface, oklch(1 0 0));
      color: var(--cngx-color-text, oklch(0.2 0.01 250));
      padding: 8px;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="scheme" [attr.data-color-scheme]="scheme()">
      <cngx-tab-group
        aria-label="Settings"
        [skin]="skin()"
        [orientation]="orientation()"
        [commitAction]="action()"
        commitMode="optimistic"
      >
        <div cngxTab [label]="'Overview'"></div>
        <div cngxTab [label]="'Activity'" [errorAggregator]="agg"></div>
        <div cngxTab [label]="'Settings'"></div>
      </cngx-tab-group>
    </div>
  `,
})
class RejectionHost {
  readonly skin = input<CngxTabsSkin>('line');
  readonly orientation = input<Orientation>('horizontal');
  readonly action = input<CngxTabsCommitAction | null>(null);
  readonly scheme = input<'light' | 'dark'>('light');
  readonly agg = stubAggregator();
}

const refuse: CngxTabsCommitAction = () => false;
const fail: CngxTabsCommitAction = () => {
  throw new Error('save failed');
};

let mountedRoot: HTMLElement | null = null;

interface Mounted {
  readonly root: HTMLElement;
  readonly tabs: HTMLElement[];
}

async function mount(
  skin: CngxTabsSkin,
  action?: CngxTabsCommitAction,
  orientation: Orientation = 'horizontal',
  scheme: 'light' | 'dark' = 'light',
): Promise<Mounted> {
  const fixture = TestBed.createComponent(RejectionHost);
  fixture.componentRef.setInput('skin', skin);
  fixture.componentRef.setInput('orientation', orientation);
  fixture.componentRef.setInput('action', action ?? null);
  fixture.componentRef.setInput('scheme', scheme);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  const tabs = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-tabs__tab'));
  if (action) {
    tabs[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  // Let the colour transitions and the 600ms rejection pulse settle.
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { root: mountedRoot, tabs };
}

function part(tab: HTMLElement, name: string): HTMLElement {
  const el = tab.querySelector<HTMLElement>(`.cngx-tabs__${name}`);
  if (!el) {
    throw new Error(`.cngx-tabs__${name} did not render`);
  }
  return el;
}

// Resolves any CSS colour to sRGB through a canvas, so oklch / oklab /
// color-mix results compare like for like.
function rgb(colour: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  ctx.canvas.width = ctx.canvas.height = 1;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(rgb(a)), luminance(rgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('tab error badge', () => {
  for (const orientation of ORIENTATIONS) {
    it(`is a bare 1.15em alert icon at stroke 2 after the label (${orientation})`, async () => {
      const { tabs } = await mount('line', undefined, orientation);
      const badge = part(tabs[1], 'badge');
      expect(computedValue(badge, 'background-color')).toBe(TRANSPARENT);
      const svg = badge.querySelector('svg')!;
      const em = parseFloat(computedValue(part(tabs[1], 'label'), 'font-size'));
      expect(svg.getBoundingClientRect().width).toBeCloseTo(1.15 * em, 0);
      expect(getComputedStyle(svg).strokeWidth).toBe('2px');
      expect(badge.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        part(tabs[1], 'label').getBoundingClientRect().right,
      );
      expect(computedValue(badge, 'color')).not.toBe(computedValue(tabs[1], 'color'));
    });
  }
});

describe('rejected tab per skin', () => {
  for (const orientation of ORIENTATIONS) {
    it(`line: colour only, the label turns the reason colour (${orientation})`, async () => {
      const resting = (await mount('line', undefined, orientation)).tabs[2];
      const restingLabel = computedValue(part(resting, 'label'), 'color');
      mountedRoot?.remove();
      const failed = (await mount('line', fail, orientation)).tabs[2];
      expect(failed.classList.contains('cngx-tab--rejected')).toBe(true);
      expect(computedValue(failed, 'background-color')).toBe(TRANSPARENT);
      expect(computedValue(failed, 'outline-style')).toBe('none');
      expect(computedValue(failed, 'box-shadow')).toBe('none');
      const failedLabel = computedValue(part(failed, 'label'), 'color');
      expect(failedLabel).not.toBe(restingLabel);
      expect(part(failed, 'rejection-icon').getBoundingClientRect().left).toBeGreaterThanOrEqual(
        part(failed, 'label').getBoundingClientRect().right,
      );
      mountedRoot?.remove();
      const refused = (await mount('line', refuse, orientation)).tabs[2];
      expect(computedValue(refused, 'background-color')).toBe(TRANSPARENT);
      const refusedLabel = computedValue(part(refused, 'label'), 'color');
      expect(refusedLabel).not.toBe(restingLabel);
      expect(refusedLabel).not.toBe(failedLabel);
    });

    for (const skin of SKINS.filter((s) => s !== 'line')) {
      it(`${skin}: a tint replaces the tab background in the skin's shape (${orientation})`, async () => {
        const resting = (await mount(skin, undefined, orientation)).tabs[2];
        const restingRadius = computedValue(resting, 'border-radius');
        const restingBg = computedValue(resting, 'background-color');
        const restingLabel = computedValue(part(resting, 'label'), 'color');
        mountedRoot?.remove();
        const failed = (await mount(skin, fail, orientation)).tabs[2];
        const failedBg = computedValue(failed, 'background-color');
        expect(failedBg).not.toBe(TRANSPARENT);
        expect(failedBg).not.toBe(restingBg);
        expect(computedValue(failed, 'border-radius')).toBe(restingRadius);
        expect(computedValue(failed, 'outline-style')).toBe('none');
        // The surface carries it; the label keeps its resting colour.
        expect(computedValue(part(failed, 'label'), 'color')).toBe(restingLabel);
        mountedRoot?.remove();
        const refused = (await mount(skin, refuse, orientation)).tabs[2];
        const refusedBg = computedValue(refused, 'background-color');
        expect(refusedBg).not.toBe(TRANSPARENT);
        expect(refusedBg).not.toBe(failedBg);
      });
    }
  }

  it('the rejection icon is a bare 1.15em glyph at stroke 2, slashed circle versus triangle', async () => {
    const refusedIcon = part((await mount('pill', refuse)).tabs[2], 'rejection-icon');
    expect(computedValue(refusedIcon, 'background-color')).toBe(TRANSPARENT);
    const svg = refusedIcon.querySelector('svg')!;
    const em = parseFloat(computedValue(refusedIcon, 'font-size'));
    expect(svg.getBoundingClientRect().width).toBeCloseTo(1.15 * em, 0);
    expect(getComputedStyle(svg).strokeWidth).toBe('2px');
    const refusedColour = computedValue(refusedIcon, 'color');
    mountedRoot?.remove();
    const failedIcon = part((await mount('pill', fail)).tabs[2], 'rejection-icon');
    expect(computedValue(failedIcon, 'color')).not.toBe(refusedColour);
  });

  for (const skin of ['line', 'segmented'] as const) {
    it(`forced colors: an outline marks the rejected ${skin} tab`, async () => {
      await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'forced-colors', value: 'active' }],
      });
      const { tabs } = await mount(skin, fail);
      expect(computedValue(tabs[2], 'outline-style')).toBe('solid');
      expect(computedValue(tabs[2], 'outline-width')).toBe('2px');
      expect(computedValue(tabs[1], 'outline-style')).not.toBe('solid');
    });
  }
});

describe('error and rejection contrast', () => {
  for (const scheme of ['light', 'dark'] as const) {
    it(`icons clear 3:1 and the line-skin labels 4.5:1 on the ${scheme} page`, async () => {
      for (const action of [fail, refuse]) {
        const { root, tabs } = await mount('line', action, 'horizontal', scheme);
        const page = computedValue(root.querySelector<HTMLElement>('.scheme')!, 'background-color');
        expect(contrast(computedValue(part(tabs[1], 'badge'), 'color'), page)).toBeGreaterThanOrEqual(3);
        expect(
          contrast(computedValue(part(tabs[2], 'rejection-icon'), 'color'), page),
        ).toBeGreaterThanOrEqual(3);
        expect(contrast(computedValue(part(tabs[2], 'label'), 'color'), page)).toBeGreaterThanOrEqual(
          4.5,
        );
        mountedRoot?.remove();
      }
    });

    it(`icons clear 3:1 on the tinted surface on the ${scheme} page`, async () => {
      for (const action of [fail, refuse]) {
        const { root, tabs } = await mount('pill', action, 'horizontal', scheme);
        const page = rgb(
          computedValue(root.querySelector<HTMLElement>('.scheme')!, 'background-color'),
        );
        // Composite the translucent tint over the page.
        const tint = computedValue(tabs[2], 'background-color');
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
        ctx.canvas.width = ctx.canvas.height = 1;
        ctx.fillStyle = `rgb(${page.join(' ')})`;
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const surface = `rgb(${r} ${g} ${b})`;
        expect(
          contrast(computedValue(part(tabs[2], 'rejection-icon'), 'color'), surface),
        ).toBeGreaterThanOrEqual(3);
        mountedRoot?.remove();
      }
    });
  }
});
