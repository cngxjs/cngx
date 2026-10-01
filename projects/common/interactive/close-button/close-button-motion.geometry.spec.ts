/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The colour transition
// of the close button is timed by --cngx-close-button-transition, a registered
// inherits:false token read on the inner .cngx-close-button__btn. A
// --cngx-duration-fast override on an ancestor has to re-time that button, not
// only the host that carries the class.

@Component({
  selector: 'cngx-close-button-motion-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './close-button.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="scale-default">
      <span class="cngx-close-button">
        <button type="button" class="cngx-close-button__btn" aria-label="Close">x</button>
      </span>
    </div>
    <div class="scale-slow" style="--cngx-duration-fast: 900ms">
      <span class="cngx-close-button">
        <button type="button" class="cngx-close-button__btn" aria-label="Close">x</button>
      </span>
    </div>
    <div class="token-hook">
      <span class="cngx-close-button">
        <button
          type="button"
          class="cngx-close-button__btn"
          style="--cngx-close-button-transition: 400ms"
          aria-label="Close"
        >
          x
        </button>
      </span>
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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('close button motion', () => {
  it('times the button from the fast rung of the motion scale', () => {
    const root = mount();
    expect(computedValue(one(root, '.scale-default .cngx-close-button__btn'), 'transition-duration')).toBe(
      '0.15s',
    );
  });

  it('re-times the button when an ancestor overrides --cngx-duration-fast', () => {
    const root = mount();
    const btn = one(root, '.scale-slow .cngx-close-button__btn');
    expect(computedValue(btn, '--cngx-close-button-transition')).toBe('0.9s');
    expect(computedValue(btn, 'transition-duration')).toBe('0.9s');
  });

  it('still honours a token set on the button itself', () => {
    const root = mount();
    expect(computedValue(one(root, '.token-hook .cngx-close-button__btn'), 'transition-duration')).toBe(
      '0.4s',
    );
  });
});
