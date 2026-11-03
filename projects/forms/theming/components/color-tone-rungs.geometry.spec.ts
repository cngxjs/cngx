import { NgTemplateOutlet } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio, oklabOf, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Rendered tier for the four core tone rungs (`--cngx-color-{primary,danger}-
// {text,strong}`); core has no geometry target, this one already renders
// system-tokens.css. Every colour is read from a solid probe's computed value
// and rasterised, never from glyph pixels, so the reads carry no
// anti-aliasing. The source contract lives in core color-text-tokens.spec.ts.

const SCHEMES = ['light', 'dark'] as const;
type Scheme = (typeof SCHEMES)[number];

// The documented warm band: a brand inside it keeps every rung at 4.5:1.
const WARM_HUES = [0, 25, 300, 330] as const;

// Band edges, light only: 50 and 280 bound the strong-fill band (both rungs
// pass), 145 and 235 the wider primary text band (the text rung passes, the
// strong fill does not). Gamut clipping moves the rendered hue by up to 14
// degrees at the edges, so they assert contrast, not hue tracking.
const STRONG_EDGE_HUES = [50, 280] as const;
const TEXT_EDGE_HUES = [145, 235] as const;
const EDGE_HUES = [...STRONG_EDGE_HUES, ...TEXT_EDGE_HUES] as const;

// Cool brands sit outside the band and re-pin both light primary rungs at
// lightness 0.5, the migration-note example.
const COOL_HUES = [150, 180, 210, 240] as const;
const REPIN = 'oklch(from var(--cngx-color-primary) 0.5 c h)';

const brand = (hue: number): string => `oklch(0.62 0.19 ${hue})`;

@Component({
  selector: 'cngx-tone-rungs-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'default-' + scheme">
        <ng-container *ngTemplateOutlet="probes" />
      </div>
      @for (hue of warmHues; track hue) {
        <div
          [attr.data-color-scheme]="scheme"
          [class]="'warm-' + scheme + '-' + hue"
          [style.--cngx-color-primary]="brand(hue)"
        >
          <ng-container *ngTemplateOutlet="probes" />
        </div>
      }
    }
    @for (hue of edgeHues; track hue) {
      <div
        data-color-scheme="light"
        [class]="'edge-' + hue"
        [style.--cngx-color-primary]="brand(hue)"
      >
        <ng-container *ngTemplateOutlet="probes" />
      </div>
    }
    @for (hue of coolHues; track hue) {
      <div
        data-color-scheme="light"
        [class]="'repin-' + hue"
        [style.--cngx-color-primary]="brand(hue)"
        [style.--cngx-color-primary-text]="repin"
        [style.--cngx-color-primary-strong]="repin"
      >
        <ng-container *ngTemplateOutlet="probes" />
      </div>
    }
    <div data-color-scheme="light" class="unpinned-180" [style.--cngx-color-primary]="brand(180)">
      <ng-container *ngTemplateOutlet="probes" />
    </div>

    <ng-template #probes>
      <span class="surface" style="color: var(--cngx-color-surface)"></span>
      <span class="primary-text" style="color: var(--cngx-color-primary-text)"></span>
      <span class="danger-text" style="color: var(--cngx-color-danger-text)"></span>
      <span class="primary-strong" style="color: var(--cngx-color-primary-strong)"></span>
      <span class="on-primary-strong" style="color: var(--cngx-color-on-primary-strong)"></span>
      <span class="danger-strong" style="color: var(--cngx-color-danger-strong)"></span>
      <span class="on-danger-strong" style="color: var(--cngx-color-on-danger-strong)"></span>
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
})
class ToneRungsHost {
  protected readonly schemes = SCHEMES;
  protected readonly warmHues = WARM_HUES;
  protected readonly edgeHues = EDGE_HUES;
  protected readonly coolHues = COOL_HUES;
  protected readonly repin = REPIN;
  protected readonly brand = brand;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ToneRungsHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function reader(root: HTMLElement, wrapper: string): (probe: string) => string {
  return (probe) => {
    const el = root.querySelector<HTMLElement>(`.${wrapper} .${probe}`);
    if (!el) {
      throw new Error(`.${wrapper} .${probe} did not render`);
    }
    return computedValue(el, 'color');
  };
}

function distance(a: string, b: string): number {
  const [l1, a1, b1] = oklabOf(a);
  const [l2, a2, b2] = oklabOf(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

function hueOf(color: string): number {
  const [, a, b] = oklabOf(color);
  return (Math.atan2(b, a) * 180) / Math.PI;
}

function hueDrift(color: string, hue: number): number {
  const delta = Math.abs(hueOf(color) - hue) % 360;
  return Math.min(delta, 360 - delta);
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('tone rungs, default palette, %s', (scheme: Scheme) => {
  it('pairs danger text with the surface at 4.5:1 both ways', () => {
    const read = reader(mount(), `default-${scheme}`);
    expect(rasterise(read('danger-text'))[3]).toBe(255);
    expect(contrastRatio(read('danger-text'), read('surface'))).toBeGreaterThanOrEqual(4.5);
  });

  it('carries the strong ink on both strong fills at 4.5:1', () => {
    const read = reader(mount(), `default-${scheme}`);
    expect(contrastRatio(read('on-primary-strong'), read('primary-strong'))).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrastRatio(read('on-danger-strong'), read('danger-strong'))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it('keeps primary text and danger text at least 0.08 apart in OKLab', () => {
    const read = reader(mount(), `default-${scheme}`);
    expect(distance(read('primary-text'), read('danger-text'))).toBeGreaterThanOrEqual(0.08);
  });
});

describe.each(SCHEMES)('tone rungs, warm brand override, %s', (scheme: Scheme) => {
  it.each(WARM_HUES)('re-hues both primary rungs to hue %i at 4.5:1', (hue) => {
    const read = reader(mount(), `warm-${scheme}-${hue}`);
    expect(contrastRatio(read('primary-text'), read('surface'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(read('on-primary-strong'), read('primary-strong'))).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(hueDrift(read('primary-text'), hue)).toBeLessThanOrEqual(10);
    expect(hueDrift(read('primary-strong'), hue)).toBeLessThanOrEqual(10);
  });
});

describe('tone rungs, band edges, light', () => {
  it.each(EDGE_HUES)('keeps primary text at 4.5:1 at hue %i', (hue) => {
    const read = reader(mount(), `edge-${hue}`);
    expect(contrastRatio(read('primary-text'), read('surface'))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(STRONG_EDGE_HUES)('keeps the strong fill at 4.5:1 with its ink at hue %i', (hue) => {
    const read = reader(mount(), `edge-${hue}`);
    expect(contrastRatio(read('on-primary-strong'), read('primary-strong'))).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

describe('tone rungs, cool brand, light', () => {
  it.each(COOL_HUES)('holds 4.5:1 at hue %i once both rungs re-pin at 0.5', (hue) => {
    const read = reader(mount(), `repin-${hue}`);
    expect(contrastRatio(read('primary-text'), read('surface'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(read('on-primary-strong'), read('primary-strong'))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  // The accepted regression: without the re-pin a cool brand drops under AA.
  it('drops under 4.5:1 at hue 180 without the re-pin', () => {
    const read = reader(mount(), 'unpinned-180');
    expect(contrastRatio(read('primary-text'), read('surface'))).toBeLessThan(4.5);
    expect(contrastRatio(read('on-primary-strong'), read('primary-strong'))).toBeLessThan(4.5);
  });
});
