/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The segments fall back
// to the --cngx-color-* foundation (Material values come from the themes
// bridge only), the in-progress segment is an opaque mix of the done colour
// toward the surface instead of opacity, and under forced colors the
// background-only bars stay visible in system colours.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-segmented-progress-colour-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './segmented-progress.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <!-- A stand-in for a Material theme that is not wired through the bridge. -->
        <div style="--mat-sys-primary: rgb(0, 92, 187); --mat-sys-surface-variant: rgb(1, 2, 3)">
          <div class="cngx-segmented-progress bar">
            <span class="cngx-segmented-progress__segment seg-done" data-state="done"></span>
            <span class="cngx-segmented-progress__segment seg-active" data-state="active"></span>
            <span class="cngx-segmented-progress__segment seg-todo" data-state="todo"></span>
            <span class="cngx-segmented-progress__segment seg-error" data-state="error"></span>
          </div>
        </div>
        <div
          class="cngx-segmented-progress custom"
          style="--cngx-segmented-progress-active-color: rgb(200, 0, 0)"
        >
          <span class="cngx-segmented-progress__segment" data-state="active"></span>
        </div>
        <span class="probe-primary" style="background: var(--cngx-color-primary)"></span>
        <span class="probe-border" style="background: var(--cngx-color-border)"></span>
        <span class="probe-danger" style="background: var(--cngx-color-danger)"></span>
        <span
          class="probe-active"
          style="background: color-mix(in oklab, var(--cngx-color-primary) 60%, var(--cngx-color-surface))"
        ></span>
        <span
          class="probe-custom-active"
          style="background: color-mix(in oklab, rgb(200, 0, 0) 60%, var(--cngx-color-surface))"
        ></span>
        <span class="plain" style="background: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-canvas" style="color: Canvas"></span>
    <span class="probe-canvas-text" style="color: CanvasText"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
    <span class="probe-mark" style="color: Mark"></span>
  `,
})
class SegmentedProgressHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SegmentedProgressHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

async function forceColors(scheme: string): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-color-scheme', value: scheme },
    ],
  });
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('segmented progress colour, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);
  const bg = (root: HTMLElement, selector: string): string =>
    computedValue(at(root, selector), 'background-color');

  it('falls back to the cngx foundation, not to --mat-sys-*', () => {
    const root = mount();
    expect(bg(root, '.seg-done')).toBe(bg(root, '.probe-primary'));
    expect(bg(root, '.seg-todo')).toBe(bg(root, '.probe-border'));
    expect(bg(root, '.seg-error')).toBe(bg(root, '.probe-danger'));
  });

  it('paints the active segment as an opaque mix toward the surface', () => {
    const root = mount();
    const active = at(root, '.seg-active');
    expect(effectiveOpacity(active)).toBe(1);
    expect(computedValue(active, 'background-color')).toBe(bg(root, '.probe-active'));
  });

  it('mixes a consumer active colour the same way', () => {
    const root = mount();
    expect(bg(root, '.custom .cngx-segmented-progress__segment')).toBe(bg(root, '.probe-custom-active'));
  });

  it('keeps every segment visible under forced colors', async () => {
    await forceColors(scheme);
    const root = mount();
    const sys = (selector: string): string => computedValue(one(root, selector), 'color');
    // The author colour is forced away, so the palette is really active.
    expect(bg(root, '.plain')).not.toBe('rgb(200, 0, 0)');
    expect(bg(root, '.seg-done')).toBe(sys('.probe-highlight'));
    expect(bg(root, '.seg-todo')).toBe(sys('.probe-canvas'));
    expect(computedValue(at(root, '.seg-todo'), 'outline-color')).toBe(sys('.probe-canvas-text'));
    expect(computedValue(at(root, '.seg-todo'), 'outline-style')).toBe('solid');
    expect(bg(root, '.seg-active')).toBe(sys('.probe-canvas'));
    expect(computedValue(at(root, '.seg-active'), 'outline-color')).toBe(sys('.probe-highlight'));
    expect(computedValue(at(root, '.seg-active'), 'outline-width')).toBe('2px');
    expect(bg(root, '.seg-error')).toBe(sys('.probe-mark'));
  });

  it('keeps the segment box under forced colors (the edge is an inset outline)', async () => {
    const before = at(mount(), '.seg-todo').getBoundingClientRect().height;
    mountedRoot?.remove();
    await forceColors(scheme);
    const forced = at(mount(), '.seg-todo').getBoundingClientRect().height;
    expect(forced).toBe(before);
  });
});
