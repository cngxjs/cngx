import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAvatar } from './avatar.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-avatar)` block (avatar.component.css:326) lays out a centred
// inline-flex plate that never grows or shrinks in a flex row, sizes itself
// from `--cngx-avatar-size`, and hangs a corner status dot off the positioned
// plate. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxAvatar],
  template: `<cngx-avatar [initials]="'AB'" [size]="size" [status]="'online'" />`,
})
class AvatarHost {
  size: 'md' | 'xl' = 'md';
}

function mount(size: 'md' | 'xl' = 'md'): HTMLElement {
  const fixture = TestBed.createComponent(AvatarHost);
  fixture.componentInstance.size = size;
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-avatar');
  if (!host) {
    throw new Error('cngx-avatar did not render');
  }
  return host as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxAvatar geometry', () => {
  it('centres content in a rigid inline-flex plate', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('inline-flex');
    expect(computedValue(host, 'align-items')).toBe('center');
    expect(computedValue(host, 'justify-content')).toBe('center');
    // flex: 0 0 auto - the plate never flexes inside a row of avatars.
    expect(computedValue(host, 'flex-grow')).toBe('0');
    expect(computedValue(host, 'flex-shrink')).toBe('0');
    // Positioned so the corner status dot anchors against it.
    expect(computedValue(host, 'position')).toBe('relative');
  });

  it('scales the plate from the size-variant token', () => {
    const host = mount('xl');
    // --xl pins --cngx-avatar-size to 4rem = 64px at the 16px root.
    expect(computedValue(host, 'width')).toBe('64px');
    expect(computedValue(host, 'height')).toBe('64px');
  });

  it('hangs the status dot off the plate corner', () => {
    const host = mount();
    const dot = host.querySelector('.cngx-avatar__status');
    if (!dot) {
      throw new Error('status dot did not render');
    }
    expect(computedValue(dot, 'position')).toBe('absolute');
  });
});

@Component({
  standalone: true,
  imports: [CngxAvatar],
  template: `
    <div
      style="--cngx-radius-pill: 7px; --cngx-color-success: rgb(10, 150, 10);
        --cngx-color-danger: rgb(200, 10, 10); --cngx-color-warning: rgb(200, 150, 10)"
    >
      <cngx-avatar class="online" [initials]="'ON'" [status]="'online'" />
      <cngx-avatar class="busy" [initials]="'BU'" [status]="'busy'" />
      <cngx-avatar class="away" [initials]="'AW'" [status]="'away'" />
    </div>
  `,
})
class ThemedAvatarHost {}

// The circle radius and status hues are registered with a fixed initial, so a
// use-site fallback never paints: the theme reaches them only through the SET.
describe('CngxAvatar theme-derived tokens', () => {
  function mountThemed(): HTMLElement {
    const fixture = TestBed.createComponent(ThemedAvatarHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    return mountedRoot;
  }
  const dot = (root: HTMLElement, status: string): string =>
    computedValue(
      root.querySelector(`.${status} .cngx-avatar__status`) as HTMLElement,
      'background-color',
    );

  it('derives the status hues and the circle radius from the theme', () => {
    const root = mountThemed();
    expect(rasterise(dot(root, 'online'))).toEqual(rasterise('rgb(10, 150, 10)'));
    expect(rasterise(dot(root, 'busy'))).toEqual(rasterise('rgb(200, 10, 10)'));
    expect(rasterise(dot(root, 'away'))).toEqual(rasterise('rgb(200, 150, 10)'));
    const host = root.querySelector('.online.cngx-avatar') as HTMLElement;
    expect(computedValue(host, 'border-top-left-radius')).toBe('7px');
  });
});
