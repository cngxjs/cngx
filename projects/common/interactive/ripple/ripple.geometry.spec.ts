import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxPressRipple } from './press-ripple.directive';
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

// Token cascade: a host-level value (the Material bridge shape, a layered
// zero-specificity rule on the .cngx-ripple host class) must reach the wave,
// two levels below the host, on both the atom and the press-ripple molecule.
// A bound [rippleColor] is the only inline write and wins.

@Component({
  selector: 'cngx-ripple-token-host',
  standalone: true,
  imports: [CngxRipple, CngxPressRipple],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-ripple.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="atom" cngxRipple style="inline-size: 100px; block-size: 40px"></div>
    <div class="molecule" cngxPressRipple style="inline-size: 100px; block-size: 40px"></div>
    <div
      class="bound"
      cngxRipple
      rippleColor="rgb(0, 0, 255)"
      style="inline-size: 100px; block-size: 40px"
    ></div>
  `,
})
class TokenHost {}

describe('CngxRipple token cascade', () => {
  let bridge: HTMLStyleElement | null = null;

  afterEach(() => {
    bridge?.remove();
    bridge = null;
  });

  function mountWithBridge(): HTMLElement {
    bridge = document.createElement('style');
    bridge.textContent = `@layer cngx.components {
      :where(.cngx-ripple) {
        --cngx-ripple-color: rgb(0, 128, 0);
        --cngx-ripple-opacity: 0.3;
        --cngx-ripple-duration: 0.8s;
      }
    }`;
    document.head.appendChild(bridge);
    const fixture = TestBed.createComponent(TokenHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    return mountedRoot;
  }

  function waveOf(root: HTMLElement, selector: string): CSSStyleDeclaration {
    const host = root.querySelector<HTMLElement>(selector);
    if (!host) {
      throw new Error(`${selector} did not render`);
    }
    host.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }),
    );
    const wave = host.querySelector('.cngx-ripple__wave');
    if (!wave) {
      throw new Error(`no wave on ${selector}`);
    }
    return getComputedStyle(wave);
  }

  it.each(['.atom', '.molecule'])('%s: the wave reads the host-level tokens', (selector) => {
    const wave = waveOf(mountWithBridge(), selector);
    expect(wave.getPropertyValue('--cngx-ripple-color').trim()).toBe('rgb(0, 128, 0)');
    expect(wave.getPropertyValue('--cngx-ripple-opacity').trim()).toBe('0.3');
    expect(wave.getPropertyValue('--cngx-ripple-duration').trim()).toBe('0.8s');
  });

  it('a bound rippleColor wins over the host-level colour', () => {
    const wave = waveOf(mountWithBridge(), '.bound');
    expect(wave.getPropertyValue('--cngx-ripple-color').trim()).toBe('rgb(0, 0, 255)');
  });
});

// Reduced motion follows the app axis in CSS: under a [data-motion='reduced']
// ancestor the wave skips the expand keyframe, appears at full size and only
// fades, and the fade's animationend removes it (no 1s fallback wait).

@Component({
  selector: 'cngx-ripple-motion-host',
  standalone: true,
  imports: [CngxRipple],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-ripple.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.data-motion]="motion()">
      <div
        cngxRipple
        class="host"
        style="inline-size: 100px; block-size: 40px; --cngx-ripple-duration: 40ms"
      ></div>
    </div>
  `,
})
class MotionHost {
  readonly motion = signal<'reduced' | null>(null);
}

describe('CngxRipple reduced motion', () => {
  function pressIn(motion: 'reduced' | null): HTMLElement {
    const fixture = TestBed.createComponent(MotionHost);
    fixture.componentInstance.motion.set(motion);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const host = mountedRoot.querySelector<HTMLElement>('.host');
    if (!host) {
      throw new Error('.host did not render');
    }
    host.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }),
    );
    return host;
  }

  it('expands the wave without a motion pick', () => {
    const wave = pressIn(null).querySelector('.cngx-ripple__wave');
    expect(wave && getComputedStyle(wave).animationName).toBe('cngx-ripple-expand');
  });

  it('fades the wave in place under data-motion="reduced"', () => {
    const wave = pressIn('reduced').querySelector('.cngx-ripple__wave');
    expect(wave && getComputedStyle(wave).animationName).toBe('cngx-ripple-fade');
  });

  it('removes the reduced wave when its fade ends', async () => {
    const host = pressIn('reduced');
    await new Promise((done) => setTimeout(done, 300));
    expect(host.querySelector('.cngx-ripple__wave')).toBeNull();
  });
});
