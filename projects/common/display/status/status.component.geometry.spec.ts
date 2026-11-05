import { Component, input, ViewEncapsulation } from '@angular/core';
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

// Loads the global micro sheet next to the component sheet, as `cngx.css` does.
@Component({
  selector: 'cngx-status-glyph-host',
  standalone: true,
  imports: [CngxStatus],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-icon-glyph.css'],
  encapsulation: ViewEncapsulation.None,
  template: '<cngx-status [tone]="tone()" label="Status" />',
})
class StatusGlyphHost {
  readonly tone = input<StatusTone>('neutral');
}

function mountGlyph(tone: StatusTone): { host: HTMLElement; dot: HTMLElement; svg: SVGSVGElement } {
  const fixture = TestBed.createComponent(StatusGlyphHost);
  fixture.componentRef.setInput('tone', tone);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector<HTMLElement>('cngx-status');
  const dot = host?.querySelector<HTMLElement>('.cngx-status__dot');
  const svg = dot?.querySelector<SVGSVGElement>('svg.cngx-icon-svg');
  if (!host || !dot || !svg) {
    throw new Error('cngx-status dot renders no glyph');
  }
  return { host, dot, svg };
}

/** The path the band rule paints. */
function paintedPath(svg: SVGSVGElement): SVGPathElement {
  const painted = Array.from(svg.querySelectorAll('path')).filter(
    (path) => computedValue(path, 'display') !== 'none',
  );
  expect(painted).toHaveLength(1);
  return painted[0];
}

const TONES: readonly StatusTone[] = ['success', 'warning', 'danger', 'info', 'neutral'];

// The question mark (neutral) carries no micro drawing and keeps its 24-grid
// fill path at 12px.
const MICRO_TONES: readonly StatusTone[] = ['success', 'warning', 'danger', 'info'];

describe('CngxStatus tone glyphs', () => {
  it.each(TONES)('sizes the %s icon box to 12px, 0.75 of the 16px dot', (tone) => {
    const { svg } = mountGlyph(tone);
    const box = svg.getBoundingClientRect();
    expect(box.width).toBe(12);
    expect(box.height).toBe(12);
  });

  it.each(MICRO_TONES)('paints the %s micro drawing', (tone) => {
    const { svg } = mountGlyph(tone);
    expect(paintedPath(svg).classList.contains('cngx-icon-svg__micro')).toBe(true);
  });

  it('paints the neutral question mark on its 24-grid fill path', () => {
    const { svg } = mountGlyph('neutral');
    expect(paintedPath(svg).classList.contains('cngx-icon-svg__path')).toBe(true);
    expect(svg.classList.contains('cngx-icon-svg--stroke')).toBe(false);
  });

  it.each(TONES)('centres the %s glyph in the dot', (tone) => {
    const { dot, svg } = mountGlyph(tone);
    const ink = paintedPath(svg).getBoundingClientRect();
    const box = dot.getBoundingClientRect();
    expect(Math.abs(ink.left + ink.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(0.5);
    expect(Math.abs(ink.top + ink.height / 2 - (box.top + box.height / 2))).toBeLessThanOrEqual(0.5);
  });

  it.each(TONES)('fills the %s glyph in the dot foreground', (tone) => {
    const { dot, svg } = mountGlyph(tone);
    expect(computedValue(paintedPath(svg), 'fill')).toBe(computedValue(dot, 'color'));
  });

  it('scales the glyph box with --cngx-status-dot-size and draws the small path at an 18px box', () => {
    const { host, svg } = mountGlyph('danger');
    host.style.setProperty('--cngx-status-dot-size', '24px');
    expect(svg.getBoundingClientRect().width).toBe(18);
    expect(paintedPath(svg).classList.contains('cngx-icon-svg__small')).toBe(true);
  });
});
