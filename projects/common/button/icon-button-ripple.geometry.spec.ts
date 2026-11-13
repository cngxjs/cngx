import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxRipple } from '@cngx/common/interactive';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxButton } from './button.component';
import { CngxIconButton } from './icon-button.component';

// Runs in a real Chromium (the `test-geometry` target). A co-hosted
// `cngxRipple` cuts only the wave to the button shape; the box itself is the
// touch target and floors to 44px on a coarse pointer, clipped or not. jsdom
// has no layout or hit testing.

@Component({
  selector: 'cngx-icon-button-ripple-geometry-host',
  standalone: true,
  imports: [CngxButton, CngxIconButton, CngxRipple],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    '../theming/components/cngx-ripple.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div data-touch="on">
      <div style="block-size: 96px; padding: 24px">
        <button cngxIconButton cngxRipple class="i-sm" size="sm" aria-label="Add">+</button>
      </div>
      <div style="block-size: 96px; padding: 24px">
        <button cngxIconButton cngxRipple class="i-md" size="md" aria-label="Add">+</button>
      </div>
      <div style="block-size: 96px; padding: 24px">
        <button cngxButton cngxRipple class="b-md">Save</button>
      </div>
    </div>
  `,
})
class GeometryHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(GeometryHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

function press(btn: HTMLElement): void {
  const rect = btn.getBoundingClientRect();
  btn.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }),
  );
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(['sm', 'md'] as const)('CngxIconButton + CngxRipple geometry: %s on touch', (size) => {
  it('keeps the box itself at the 44px floor with the host clipped', () => {
    const btn = query(mount(), `.i-${size}`);
    btn.style.overflow = 'hidden';
    press(btn);
    expect(btn.querySelector('.cngx-ripple__wave')).not.toBeNull();
    const rect = btn.getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44 - 0.5);
    expect(rect.height).toBeGreaterThanOrEqual(44 - 0.5);
  });

  it('clips the wave to the button radius, not the host', () => {
    const btn = query(mount(), `.i-${size}`);
    press(btn);

    const hostStyle = getComputedStyle(btn);
    expect(hostStyle.overflow).toBe('visible');
    expect(hostStyle.position).toBe('relative');

    const container = query(btn, '.cngx-ripple__container');
    const wave = query(container, '.cngx-ripple__wave');
    expect(wave.parentElement).toBe(container);

    const containerStyle = getComputedStyle(container);
    expect(containerStyle.overflow).toBe('hidden');
    expect(containerStyle.position).toBe('absolute');
    expect(containerStyle.pointerEvents).toBe('none');
    expect(containerStyle.borderTopLeftRadius).toBe(hostStyle.borderTopLeftRadius);
    expect(parseFloat(containerStyle.borderTopLeftRadius)).toBeGreaterThan(0);

    // The container covers the padding box: the box minus the border.
    const border = parseFloat(hostStyle.borderTopWidth);
    const box = btn.getBoundingClientRect();
    const layer = container.getBoundingClientRect();
    expect(layer.width).toBeCloseTo(box.width - 2 * border, 0);
    expect(layer.height).toBeCloseTo(box.height - 2 * border, 0);
  });
});

describe('CngxButton + CngxRipple geometry: touch', () => {
  it('keeps the host unclipped and the 44px floor after a ripple', () => {
    const btn = query(mount(), '.b-md');
    press(btn);
    expect(getComputedStyle(btn).overflow).toBe('visible');
    expect(btn.getBoundingClientRect().height).toBeGreaterThanOrEqual(44 - 0.5);
  });
});
