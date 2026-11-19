import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxToggle } from './toggle.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-toggle)` block (toggle.component.css:259) lays the track + label on
// one inline-flex line, floors the block axis to `--cngx-target-min`, sizes a
// rigid track that hosts an absolutely-positioned thumb, and reverses the row
// under `--label-before`. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxToggle],
  template: `<cngx-toggle [labelPosition]="labelPosition">Notify</cngx-toggle>`,
})
class ToggleHost {
  labelPosition: 'before' | 'after' = 'after';
}

function mount(labelPosition: 'before' | 'after' = 'after'): HTMLElement {
  const fixture = TestBed.createComponent(ToggleHost);
  fixture.componentInstance.labelPosition = labelPosition;
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-toggle');
  if (!host) {
    throw new Error('cngx-toggle did not render');
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

@Component({
  standalone: true,
  imports: [CngxToggle],
  template: `
    <cngx-toggle class="toggle-default" [value]="true">Default</cngx-toggle>
    <div style="--cngx-color-primary: oklch(0.55 0.15 250)">
      <cngx-toggle class="toggle-branded" [value]="true">Branded</cngx-toggle>
    </div>
  `,
})
class CheckedToggleHost {}

// Track and thumb tokens are read on the __track / __thumb descendants, so a
// consumer SET on the host only reaches them through inheritance.
@Component({
  standalone: true,
  imports: [CngxToggle],
  template: `
    <cngx-toggle
      [value]="true"
      style="
        --cngx-toggle-track-bg-on: rgb(255, 0, 0);
        --cngx-toggle-track-width: 3rem;
        --cngx-toggle-track-height: 2rem;
        --cngx-toggle-track-radius: 4px;
        --cngx-toggle-thumb-size: 1.5rem;
        --cngx-toggle-thumb-travel: 1.5rem;
        --cngx-toggle-thumb-bg: rgb(0, 0, 255);
        --cngx-toggle-thumb-shadow: none;
      "
      >Host tokens</cngx-toggle
    >
  `,
})
class HostTokenToggleHost {}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxToggle geometry', () => {
  it('lays the track and label on one inline-flex line', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('inline-flex');
    expect(computedValue(host, 'align-items')).toBe('center');
    // Only the block axis is floored - the track is intrinsically wide.
    host.style.setProperty('--cngx-target-min', '44px');
    expect(computedValue(host, 'min-block-size')).toBe('44px');
  });

  it('anchors the thumb inside a rigid track', () => {
    const host = mount();
    const track = query(host, '.cngx-toggle__track');
    expect(computedValue(track, 'position')).toBe('relative');
    expect(computedValue(track, 'flex-grow')).toBe('0');
    expect(computedValue(track, 'flex-shrink')).toBe('0');
    // The thumb is absolutely placed against the track.
    expect(computedValue(query(host, '.cngx-toggle__thumb'), 'position')).toBe('absolute');
  });

  it('reverses the row under label-before', () => {
    const host = mount('before');
    expect(computedValue(host, 'flex-direction')).toBe('row-reverse');
  });

  // The on-track falls back to the primary at the use site; a registered
  // initial-value would shadow that fallback and paint Ember under any brand.
  it('paints the checked track with the primary in scope', () => {
    const fixture = TestBed.createComponent(CheckedToggleHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const trackBg = (selector: string): string =>
      computedValue(
        query(mountedRoot as HTMLElement, `${selector} .cngx-toggle__track`),
        'background-color',
      );
    expect(rasterise(trackBg('.toggle-branded'))).toEqual(rasterise('oklch(0.55 0.15 250)'));
    expect(rasterise(trackBg('.toggle-default'))).toEqual(rasterise('oklch(0.66 0.19 50)'));
  });

  it('carries track and thumb tokens set on the host to the descendants', () => {
    const fixture = TestBed.createComponent(HostTokenToggleHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const track = query(mountedRoot, '.cngx-toggle__track');
    const thumb = query(mountedRoot, '.cngx-toggle__thumb');
    expect(rasterise(computedValue(track, 'background-color'))).toEqual(
      rasterise('rgb(255, 0, 0)'),
    );
    expect(computedValue(track, 'inline-size')).toBe('48px');
    expect(computedValue(track, 'block-size')).toBe('32px');
    expect(computedValue(track, 'border-top-left-radius')).toBe('4px');
    expect(computedValue(thumb, 'inline-size')).toBe('24px');
    expect(computedValue(thumb, 'transform')).toBe('matrix(1, 0, 0, 1, 24, 0)');
    expect(rasterise(computedValue(thumb, 'background-color'))).toEqual(
      rasterise('rgb(0, 0, 255)'),
    );
    expect(computedValue(thumb, 'box-shadow')).toBe('none');
    // The inset is derived on the host from the same height and size, so the
    // thumb stays centred in the track instead of overflowing it.
    expect(computedValue(thumb, 'inset-block-start')).toBe('4px');
  });
});

// The focus and track radii are registered with a fixed initial, so a use-site
// fallback never paints: the theme reaches them only through the SET.
describe('CngxToggle theme-derived radii', () => {
  it('derives the focus radius from the sm radius and the track radius from the pill radius', () => {
    const host = mount();
    mountedRoot!.style.setProperty('--cngx-radius-sm', '5px');
    mountedRoot!.style.setProperty('--cngx-radius-pill', '6px');
    expect(computedValue(host, '--cngx-toggle-focus-radius')).toBe('5px');
    expect(computedValue(query(host, '.cngx-toggle__track'), 'border-top-left-radius')).toBe('6px');
  });

  it('paints the focus ring with the primary in scope', () => {
    const host = mount();
    mountedRoot!.style.setProperty('--cngx-color-primary', 'rgb(0, 0, 200)');
    expect(computedValue(host, '--cngx-toggle-focus-outline')).toBe('2px solid rgb(0, 0, 200)');
  });
});
