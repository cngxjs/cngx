/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCloseButton } from './close-button.component';

// Runs in a real Chromium (the `test-geometry` target). The close button has
// no timing token of its own: its colour transition is the button family's
// --cngx-button-transition, SET from the fast rung of the motion scale. A
// --cngx-duration-fast override on an ancestor has to re-time it.

@Component({
  selector: 'cngx-close-button-motion-host',
  standalone: true,
  imports: [CngxCloseButton],
  styleUrls: ['../../core/theming/layers.css', '../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="scale-default">
      <button cngxCloseButton aria-label="Close"></button>
    </div>
    <div class="scale-slow" style="--cngx-duration-fast: 900ms">
      <button cngxCloseButton aria-label="Close"></button>
    </div>
    <div class="token-hook">
      <button cngxCloseButton style="--cngx-button-transition: 400ms" aria-label="Close"></button>
    </div>
  `,
})
class CloseButtonMotionHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CloseButtonMotionHost);
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

function colourDuration(el: HTMLElement): string {
  const props = computedValue(el, 'transition-property').split(',').map((p) => p.trim());
  const durations = computedValue(el, 'transition-duration').split(',').map((d) => d.trim());
  return durations[props.indexOf('color')] ?? '';
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('close button motion', () => {
  it('times the colour transition from the fast rung of the motion scale', () => {
    const root = mount();
    expect(colourDuration(one(root, '.scale-default .cngx-close-button'))).toBe('0.15s');
  });

  it('re-times the button when an ancestor overrides --cngx-duration-fast', () => {
    const root = mount();
    const btn = one(root, '.scale-slow .cngx-close-button');
    expect(computedValue(btn, '--cngx-button-transition')).toBe('0.9s');
    expect(colourDuration(btn)).toBe('0.9s');
  });

  it('still honours a token set on the button itself', () => {
    const root = mount();
    expect(colourDuration(one(root, '.token-hook .cngx-close-button'))).toBe('0.4s');
  });
});
