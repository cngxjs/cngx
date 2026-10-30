import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStatus, type StatusTone } from './status.component';

// Runs in a real Chromium (the `test-geometry` target): every read here is a
// resolved CSSOM value that jsdom returns as `''`.
//
// The strongest guard target in the repo - a token cascade that already broke
// once and was fixed in `fix(common/data): make CngxStatus dot-size and gap
// tokens inheritable (#250)` (commit 002e5f78). Nothing observed the fix until
// this spec: the resolved value is exactly what jsdom cannot see. It also
// covers the two recorded traps in their general form - a host-set token that
// must reach a descendant (inherits: false would freeze it) and a registered
// token whose fixed light initial must not defeat the dark-mode SET.

let mountedRoot: HTMLElement | null = null;

function mount(tone: StatusTone = 'neutral'): { host: HTMLElement; dot: HTMLElement } {
  const fixture = TestBed.createComponent(CngxStatus);
  fixture.componentRef.setInput('tone', tone);
  fixture.componentRef.setInput('label', 'Status');
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const dot = mountedRoot.querySelector('.cngx-status__dot');
  if (!dot) {
    throw new Error('cngx-status dot did not render');
  }
  return { host: mountedRoot, dot: dot as HTMLElement };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxStatus geometry', () => {
  it('sizes the dot from the registered dot-size default', () => {
    const { dot } = mount();
    expect(parseFloat(computedValue(dot, 'inline-size'))).toBeCloseTo(16, 1);
  });

  it('lets a host-set dot-size reach the dot - the #250 inherits contract', () => {
    // The regression: with `inherits: false` the descendant dot would ignore a
    // host-set token and stay at the 16px registered initial.
    const { host, dot } = mount();
    host.style.setProperty('--cngx-status-dot-size', '40px');
    expect(computedValue(dot, '--cngx-status-dot-size')).toBe('40px');
    expect(parseFloat(computedValue(dot, 'inline-size'))).toBeCloseTo(40, 1);
  });

  it('derives the gap from the space scale rather than the registered initial', () => {
    const { host } = mount();
    const before = parseFloat(computedValue(host, 'column-gap'));
    host.style.setProperty('--cngx-space-sm', '20px');
    const after = parseFloat(computedValue(host, 'column-gap'));
    expect(after).toBeCloseTo(20, 1);
    expect(after).not.toBeCloseTo(before, 1);
  });

  it('adapts the success dot to dark mode via the SET, not the light initial', () => {
    // A registered `<color>` token with a fixed light initial-value defeats any
    // use-site fallback, so dark mode has to SET it. If a future change dropped
    // that SET and leaned on a use-site fallback, the dot would stay light and
    // this divergence would vanish.
    const { host, dot } = mount('success');
    host.setAttribute('data-color-scheme', 'light');
    const light = computedValue(dot, 'background-color');
    host.setAttribute('data-color-scheme', 'dark');
    const dark = computedValue(dot, 'background-color');
    expect(light).not.toBe('');
    expect(dark).not.toBe('');
    expect(dark).not.toBe(light);
  });
});

// ── Tone glyphs from the shared icon set (status.component.css) ───────────────

function px(el: Element, property: string): number {
  return parseFloat(computedValue(el, property));
}

interface GlyphInk {
  readonly width: number;
  readonly height: number;
  readonly dx: number;
  readonly dy: number;
}

// The drawn extent of a stroke glyph includes half the stroke on each side;
// the path box alone is the geometric centre line.
function glyphInk(dot: HTMLElement): GlyphInk {
  const svg = dot.querySelector<SVGSVGElement>('svg.cngx-icon-svg');
  const path = svg?.querySelector('path');
  if (!svg || !path) {
    throw new Error('cngx-status dot renders no glyph');
  }
  const stroke = svg.classList.contains('cngx-icon-svg--stroke')
    ? (px(svg, 'stroke-width') * svg.getBoundingClientRect().width) / 24
    : 0;
  const ink = path.getBoundingClientRect();
  const box = dot.getBoundingClientRect();
  return {
    width: ink.width + stroke,
    height: ink.height + stroke,
    dx: ink.left + ink.width / 2 - (box.left + box.width / 2),
    dy: ink.top + ink.height / 2 - (box.top + box.height / 2),
  };
}

// Box of each tone icon as a fraction of the dot: scaled so the glyph's outer
// edge, stroke included, sits at 65% of the dot diameter from the centre.
const TONE_BOX: ReadonlyArray<[StatusTone, number]> = [
  ['success', 0.754],
  ['warning', 0.918],
  ['danger', 0.764],
  ['info', 0.918],
  ['neutral', 0.996],
];

describe('CngxStatus tone glyphs', () => {
  it.each(TONE_BOX)('sizes the %s icon box to %s of the dot', (tone, fraction) => {
    const { dot } = mount(tone);
    const svg = dot.querySelector('svg.cngx-icon-svg') as SVGSVGElement;
    expect(svg.getBoundingClientRect().width).toBeCloseTo(
      fraction * dot.getBoundingClientRect().width,
      1,
    );
  });

  it.each(TONE_BOX)('centres the %s glyph in the dot', (tone) => {
    const { dot } = mount(tone);
    const ink = glyphInk(dot);
    expect(Math.abs(ink.dx)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(ink.dy)).toBeLessThanOrEqual(0.5);
  });

  it.each(['success', 'danger', 'neutral'] as const)(
    'draws the %s line glyph with a 1.75px stroke',
    (tone) => {
      const { dot } = mount(tone);
      const svg = dot.querySelector('svg.cngx-icon-svg') as SVGSVGElement;
      const strokePx = (px(svg, 'stroke-width') * svg.getBoundingClientRect().width) / 24;
      expect(strokePx).toBeCloseTo(1.75, 1);
      expect(computedValue(svg, 'stroke')).toBe(computedValue(dot, 'color'));
    },
  );

  it.each(['warning', 'info'] as const)('fills the %s glyph in the dot foreground', (tone) => {
    const { dot } = mount(tone);
    const svg = dot.querySelector('svg.cngx-icon-svg') as SVGSVGElement;
    expect(svg.classList.contains('cngx-icon-svg--stroke')).toBe(false);
    expect(computedValue(svg, 'fill')).toBe(computedValue(dot, 'color'));
  });

  it('scales the glyph with --cngx-status-dot-size', () => {
    const { host, dot } = mount('danger');
    const before = glyphInk(dot).width;
    host.style.setProperty('--cngx-status-dot-size', '24px');
    expect(glyphInk(dot).width).toBeCloseTo(before * 1.5, 1);
  });
});
