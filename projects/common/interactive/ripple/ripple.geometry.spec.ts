import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRipple } from './ripple.directive';

// Runs in a real Chromium (the `test-geometry` target). The directive measures
// the press point from the host's physical left edge, so the wave must land on
// that point in both writing directions. jsdom has no layout.

@Component({
  selector: 'cngx-ripple-geometry-host',
  standalone: true,
  imports: [CngxRipple],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-ripple.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.dir]="dir()" style="padding: 24px">
      <div
        cngxRipple
        [rippleCentered]="centered()"
        class="host"
        style="inline-size: 200px; block-size: 100px; border: 0; border-radius: 8px"
      ></div>
    </div>
  `,
})
class GeometryHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly centered = signal(false);
}

let mountedRoot: HTMLElement | null = null;

function mount(dir: 'ltr' | 'rtl', centered = false): HTMLElement {
  const fixture = TestBed.createComponent(GeometryHost);
  fixture.componentInstance.dir.set(dir);
  fixture.componentInstance.centered.set(centered);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.host');
  if (!host) {
    throw new Error('.host did not render');
  }
  return host as HTMLElement;
}

/** Presses at `(dx, dy)` from the host's top-left corner and returns the wave centre in the same frame. */
function pressAt(host: HTMLElement, dx: number, dy: number): { x: number; y: number } {
  const rect = host.getBoundingClientRect();
  host.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, clientX: rect.left + dx, clientY: rect.top + dy }),
  );
  const wave = host.querySelector('.cngx-ripple__wave');
  if (!wave) {
    throw new Error('no wave rendered');
  }
  // The scale animation keeps the box centre fixed (transform-origin: center).
  const w = wave.getBoundingClientRect();
  return { x: w.left + w.width / 2 - rect.left, y: w.top + w.height / 2 - rect.top };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(['ltr', 'rtl'] as const)('CngxRipple geometry: %s', (dir) => {
  it('centres the wave on the press point', () => {
    const centre = pressAt(mount(dir), 40, 30);
    expect(Math.abs(centre.x - 40)).toBeLessThanOrEqual(1);
    expect(Math.abs(centre.y - 30)).toBeLessThanOrEqual(1);
  });

  it('centres the wave on the host centre in centred mode', () => {
    const centre = pressAt(mount(dir, true), 40, 30);
    expect(Math.abs(centre.x - 100)).toBeLessThanOrEqual(1);
    expect(Math.abs(centre.y - 50)).toBeLessThanOrEqual(1);
  });
});
