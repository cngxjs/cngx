/// <reference types="@vitest/browser-playwright" />

import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxSelectOption } from '../declarative/option.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';
import type { CngxSelectOptionDef } from './option.model';

// Runs in a real Chromium (the `test-geometry` target). Pins the strand-B
// theming contract: a host-set token reaches the panel (E2), a colour-scheme
// island keeps panel and disabled-option text legible (E1), the error text tier
// clears 4.5:1 on white (E3), the skeleton shimmer follows the app scheme not
// the OS (E4), and the keyboard-active row and the tree container carry a
// visible affordance (E5). The red cases are `it.fails` until Phase 2 flips
// them.

const HARNESS_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  '../../../core/theming/reset.css',
  '../../../core/theming/base.css',
  '../../theming/components/cngx-field-affix.css',
  '../../theming/components/cngx-field-skin.css',
  './select-base.css',
  '../tree-select/tree-select-panel.component.css',
];

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue', disabled: true },
];

interface Openable {
  open(): void;
}

@Component({
  selector: 'cngx-select-theming-host',
  standalone: true,
  imports: [CngxSelect, CngxTreeSelect, CngxSelectShell, CngxSelectOption],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      [attr.data-color-scheme]="scheme()"
      style="display: block; inline-size: 20rem; padding: 1rem; background: var(--cngx-color-surface)"
    >
      @switch (variant()) {
        @case ('select') {
          <cngx-select
            #v
            [label]="'C'"
            [options]="options"
            [loading]="loading()"
            [loadingVariant]="loading() ? 'skeleton' : 'spinner'"
            [skeletonRowCount]="3"
            [style.--cngx-select-panel-max-height]="maxHeight()"
          />
        }
        @case ('tree') {
          <cngx-tree-select #v [label]="'C'" [nodes]="options" [nodeIdFn]="nodeId" />
        }
      }
      <span class="probe-white" style="color: #000; background: #fff"></span>
      <span class="probe-error" style="background: #fff; color: var(--cngx-select-error-color)"></span>
      <span
        class="probe-option-error"
        style="background: #fff; color: var(--cngx-select-option-error-color)"
      ></span>
    </div>
  `,
})
class ThemingHost {
  readonly options = OPTIONS;
  readonly variant = signal<'select' | 'tree'>('select');
  readonly scheme = signal<string | null>(null);
  readonly loading = signal(false);
  readonly maxHeight = signal<string | null>(null);
  readonly nodeId = (value: unknown): string => String(value);
  readonly select = viewChild.required<Openable>('v');
}

// -- colour helpers (resolve any CSS colour via a canvas, then WCAG contrast) --

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

function resolveColour(value: string): Rgba {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000';
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b, a: a / 255 };
}

function over(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a + bg.a * (1 - fg.a);
  const mix = (f: number, b: number) => (f * fg.a + b * bg.a * (1 - fg.a)) / (a || 1);
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a };
}

function luminance({ r, g, b }: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgba, b: Rgba): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function colourOf(el: Element, property: string): Rgba {
  return resolveColour(computedValue(el, property));
}

let mountedRoot: HTMLElement | null = null;

function mount(configure?: (host: ThemingHost) => void) {
  const fixture = TestBed.createComponent(ThemingHost);
  configure?.(fixture.componentInstance);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return fixture;
}

async function nextFrame(): Promise<void> {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}

async function open(fixture: { componentInstance: ThemingHost; detectChanges(): void }) {
  fixture.componentInstance.select().open();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  await nextFrame();
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`${selector} did not render`);
  return el;
}

async function emulateScheme(value: 'light' | 'dark') {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value }],
  });
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('select review 2 theming', () => {
  // E1 - a dark island on a light page keeps panel text legible. The panel
  // surface already reaches the island (panel-bg is `inherits: true`), so the
  // enabled row text clears 4.5:1 today; this case pins that invariant. The
  // disabled recipe and the error tier below are the red half of E1/E3.
  it('E1: island panel text clears 4.5:1 on the panel background', async () => {
    const fixture = mount((h) => h.scheme.set('dark'));
    const root = fixture.nativeElement as HTMLElement;
    await open(fixture);
    const panel = one(root, '.cngx-select__panel');
    const option = one(panel, '.cngx-select__option:not([aria-disabled="true"])');
    const panelBg = colourOf(panel, 'background-color');
    const text = over(colourOf(option, 'color'), panelBg);
    expect(contrast(text, panelBg)).toBeGreaterThanOrEqual(4.5);
  });

  it.fails('E1: island disabled-option text clears 4.5:1 on the panel background', async () => {
    const fixture = mount((h) => h.scheme.set('dark'));
    const root = fixture.nativeElement as HTMLElement;
    await open(fixture);
    const panel = one(root, '.cngx-select__panel');
    const disabled = one(panel, '.cngx-select__option[aria-disabled="true"]');
    const panelBg = colourOf(panel, 'background-color');
    const text = over(colourOf(disabled, 'color'), panelBg);
    expect(contrast(text, panelBg)).toBeGreaterThanOrEqual(4.5);
  });

  // E2 - a host-set max-height reaches the panel.
  it('E2: a host-set panel max-height reaches the panel', async () => {
    const fixture = mount((h) => h.maxHeight.set('30rem'));
    const root = fixture.nativeElement as HTMLElement;
    await open(fixture);
    expect(computedValue(one(root, '.cngx-select__panel'), 'max-height')).toBe('480px');
  });

  // E3 - error text reads the danger-text tier (>= 4.5:1 on white).
  it.fails('E3: the select error colour clears 4.5:1 on white', () => {
    const root = mount().nativeElement as HTMLElement;
    const white = colourOf(one(root, '.probe-white'), 'background-color');
    expect(contrast(colourOf(one(root, '.probe-error'), 'color'), white)).toBeGreaterThanOrEqual(4.5);
  });

  it.fails('E3: the option error colour clears 4.5:1 on white', () => {
    const root = mount().nativeElement as HTMLElement;
    const white = colourOf(one(root, '.probe-white'), 'background-color');
    expect(
      contrast(colourOf(one(root, '.probe-option-error'), 'color'), white),
    ).toBeGreaterThanOrEqual(4.5);
  });

  // E4 - the skeleton shimmer follows the app scheme, not the OS alone.
  it.fails('E4: a light app keeps the skeleton paint across OS schemes', async () => {
    await emulateScheme('light');
    let fixture = mount((h) => h.loading.set(true));
    await open(fixture);
    const light = computedValue(one(fixture.nativeElement, '.cngx-select__skeleton-row'), 'background-image');
    mountedRoot?.remove();
    await emulateScheme('dark');
    fixture = mount((h) => h.loading.set(true));
    await open(fixture);
    const dark = computedValue(one(fixture.nativeElement, '.cngx-select__skeleton-row'), 'background-image');
    expect(dark).toBe(light);
  });

  // E5 - the keyboard-active row carries a >= 3:1 affordance.
  it.fails('E5: the active row affordance clears 3:1 against the panel', async () => {
    const fixture = mount();
    const root = fixture.nativeElement as HTMLElement;
    await open(fixture);
    const panel = one(root, '.cngx-select__panel');
    const panelBg = colourOf(panel, 'background-color');
    const option = one(panel, '.cngx-select__option:not([aria-disabled="true"])');
    option.classList.add('cngx-option--highlighted');
    const rowBg = over(colourOf(option, 'background-color'), panelBg);
    const shadow = computedValue(option, 'box-shadow');
    const shadowColour = shadow !== 'none' ? resolveColour(shadow.match(/(?:rgb|oklch|oklab|color|#)\S[^)]*\)?/)?.[0] ?? '#0000') : null;
    const borderStart = colourOf(option, 'border-inline-start-color');
    const borderWidth = parseFloat(computedValue(option, 'border-inline-start-width'));
    const affordances = [contrast(rowBg, panelBg)];
    if (shadowColour && shadowColour.a > 0) affordances.push(contrast(shadowColour, panelBg));
    if (borderWidth > 0) affordances.push(contrast(borderStart, panelBg));
    expect(Math.max(...affordances)).toBeGreaterThanOrEqual(3);
  });

  // E5 - the tree container keeps a focus-visible outline.
  it.fails('E5: the tree container shows a focus-visible outline', async () => {
    const fixture = mount((h) => h.variant.set('tree'));
    const root = fixture.nativeElement as HTMLElement;
    await open(fixture);
    const tree = one(root, '.cngx-tree-select__tree');
    tree.focus({ focusVisible: true } as FocusOptions);
    expect(computedValue(tree, 'outline-style')).not.toBe('none');
    expect(parseFloat(computedValue(tree, 'outline-width'))).toBeGreaterThan(0);
  });
});
