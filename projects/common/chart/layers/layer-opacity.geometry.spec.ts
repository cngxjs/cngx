import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxChart } from '../chart/chart.component';
import { CngxMiniArea } from '../presets/mini-area.component';
import { CngxArea } from './area.component';
import { CngxBand } from './band.component';

// Runs in a real Chromium (the `test-geometry` target): only a real cascade
// shows that the class rule `fill-opacity: var(--cngx-*-opacity, ...)` beats a
// `fill-opacity` presentation attribute. The [opacity] input must win over
// that rule, and an unset input must leave the custom property in charge.

@Component({
  standalone: true,
  imports: [CngxChart, CngxArea, CngxBand, CngxMiniArea],
  template: `
    <cngx-chart class="set" [data]="[1, 3, 2]" [width]="200" [height]="100" aria-label="set">
      <svg:g cngxBand [from]="1" [to]="2" [opacity]="0.3"></svg:g>
      <svg:g cngxArea [opacity]="0.4"></svg:g>
    </cngx-chart>
    <cngx-chart class="unset" [data]="[1, 3, 2]" [width]="200" [height]="100" aria-label="unset">
      <svg:g cngxBand [from]="1" [to]="2"></svg:g>
      <svg:g cngxArea></svg:g>
    </cngx-chart>
    <cngx-chart
      class="token"
      [data]="[1, 3, 2]"
      [width]="200"
      [height]="100"
      aria-label="token"
      style="--cngx-band-opacity: 0.25; --cngx-area-opacity: 0.5"
    >
      <svg:g cngxBand [from]="1" [to]="2"></svg:g>
      <svg:g cngxArea></svg:g>
    </cngx-chart>
    <cngx-mini-area class="mini" [data]="[1, 3, 2]" [opacity]="0.6" aria-label="mini" />
  `,
})
class OpacityHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(OpacityHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function fillOpacity(root: ParentNode, selector: string): string {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return computedValue(el, 'fill-opacity');
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxArea / CngxBand [opacity]', () => {
  it('wins over the opacity custom property default', () => {
    const root = mount();
    expect(fillOpacity(root, '.set .cngx-band__rect')).toBe('0.3');
    expect(fillOpacity(root, '.set .cngx-area')).toBe('0.4');
  });

  it('leaves the default in charge when unset', () => {
    const root = mount();
    expect(fillOpacity(root, '.unset .cngx-band__rect')).toBe('0.12');
    expect(fillOpacity(root, '.unset .cngx-area')).toBe('0.18');
  });

  it('leaves a custom property override in charge when unset', () => {
    const root = mount();
    expect(fillOpacity(root, '.token .cngx-band__rect')).toBe('0.25');
    expect(fillOpacity(root, '.token .cngx-area')).toBe('0.5');
  });

  it('reaches the area of cngx-mini-area through its [opacity]', () => {
    const root = mount();
    expect(fillOpacity(root, '.mini .cngx-area')).toBe('0.6');
  });
});
