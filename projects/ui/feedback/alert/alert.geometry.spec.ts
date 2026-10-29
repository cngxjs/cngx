import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAlert } from './alert';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-alert)` block SETs (alert.css): the alert is a top-aligned flex
// row (icon, body, dismiss), the body grows and may shrink past its intrinsic
// width so a long message wraps instead of pushing the dismiss off the edge, and
// the dismiss (a cngxCloseButton) keeps its box while its hit area floors to the
// pointer-derived target. This one spec sits in `feedback/alert/`, which also
// carries `alert-stack.css` under the folder-level coverage heuristic. jsdom
// reports `''` for every one of these reads.

@Component({
  selector: 'cngx-alert-geometry-host',
  standalone: true,
  imports: [CngxAlert],
  template: `<cngx-alert [severity]="'info'" [closable]="true">Something happened</cngx-alert>`,
})
class AlertHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AlertHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-alert');
  if (!host) {
    throw new Error('cngx-alert did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxAlert geometry', () => {
  it('lays the alert out as a top-aligned flex row', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('flex');
    expect(computedValue(host, 'align-items')).toBe('flex-start');
  });

  it('grows the body and lets it shrink below its intrinsic width', () => {
    const host = mount();
    const body = query(host, '.cngx-alert__body');
    expect(computedValue(body, 'flex-grow')).toBe('1');
    expect(computedValue(body, 'min-width')).toBe('0px');
  });

  it('floors the dismiss hit area to the pointer-derived minimum', () => {
    const host = mount();
    const dismiss = query(host, '.cngx-alert__dismiss');
    // The dismiss is a cngxCloseButton: its visual box keeps its size and the
    // centred ::before hit area is max(100%, var(--cngx-target-min, 0px)), inert
    // on a fine pointer and lifted to the floor on a coarse one.
    // 100% resolves against the padding box (the containing block of the
    // absolutely positioned pseudo-element), so it is compared to clientWidth.
    const box = dismiss.getBoundingClientRect();
    const hit = (prop: 'inline-size' | 'block-size') =>
      parseFloat(getComputedStyle(dismiss, '::before').getPropertyValue(prop));
    expect(Math.abs(hit('inline-size') - dismiss.clientWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(hit('block-size') - dismiss.clientHeight)).toBeLessThanOrEqual(1);
    expect(hit('inline-size')).toBeLessThan(44);
    host.style.setProperty('--cngx-target-min', '44px');
    expect(hit('inline-size')).toBe(44);
    expect(hit('block-size')).toBe(44);
    expect(dismiss.getBoundingClientRect().width).toBeCloseTo(box.width, 0);
  });
});

// ── Severity glyphs from the shared icon set (config/severity-icon.ts) ────────

describe('CngxAlert severity glyphs', () => {
  function mountSeverity(severity: 'info' | 'success' | 'warning' | 'error'): HTMLElement {
    const fixture = TestBed.createComponent(CngxAlert);
    fixture.componentRef.setInput('severity', severity);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    return mountedRoot;
  }

  function glyph(host: HTMLElement): {
    cell: HTMLElement;
    svg: SVGSVGElement;
    path: SVGPathElement;
  } {
    const cell = query(host, '.cngx-alert__icon');
    const svg = cell.querySelector<SVGSVGElement>('svg.cngx-alert__default-icon');
    const path = svg?.querySelector('path');
    if (!svg || !path) {
      throw new Error('cngx-alert renders no severity glyph');
    }
    return { cell, svg, path };
  }

  function stroke(svg: SVGSVGElement): number {
    return (
      (parseFloat(computedValue(svg, 'stroke-width')) * svg.getBoundingClientRect().width) / 24
    );
  }

  // The 20px drawings they replaced inked their circles 22 of 24 units across.
  it.each(['info', 'success', 'error'] as const)(
    'draws the %s circle 22/24 of the icon size',
    (severity) => {
      const { svg, path } = glyph(mountSeverity(severity));
      expect(path.getBoundingClientRect().width + stroke(svg)).toBeCloseTo((20 * 22) / 24, 1);
    },
  );

  it('sits the glyph at the top of the icon cell as a block', () => {
    const { cell, svg } = glyph(mountSeverity('warning'));
    expect(computedValue(svg, 'display')).toBe('block');
    expect(svg.getBoundingClientRect().top).toBeCloseTo(cell.getBoundingClientRect().top, 1);
  });

  it('paints the stroke in the severity icon colour', () => {
    const { cell, svg } = glyph(mountSeverity('error'));
    expect(computedValue(svg, 'stroke')).toBe(computedValue(cell, 'color'));
    expect(computedValue(svg, 'fill')).toBe('none');
  });
});
