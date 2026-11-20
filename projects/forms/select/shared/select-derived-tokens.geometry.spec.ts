/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The commit error hint
// colour is registered with a fixed initial, so a use-site fallback never
// paints: the theme and the dark scheme reach it only through the SET. The
// chip overflow badge reads the chip radius, so it stays a pill like the chips.

@Component({
  selector: 'cngx-select-derived-tokens-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    './select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="scheme-default">
      <div class="cngx-select__commit-error-hint">Not saved</div>
      <span class="probe" style="color: var(--cngx-color-danger-text)"></span>
      <span class="cngx-select__chip-overflow-badge badge-default">+2</span>
      <span class="cngx-select__chip-overflow-badge badge-themed" style="--cngx-chip-radius: 3px"
        >+2</span
      >
    </div>
    <div class="scheme-dark" data-color-scheme="dark">
      <div class="cngx-select__commit-error-hint">Not saved</div>
      <span class="probe" style="color: var(--cngx-color-danger-text)"></span>
    </div>
    <div class="scheme-light" data-color-scheme="light">
      <div class="cngx-select__panel">panel</div>
    </div>
    <div class="cngx-select__panel panel-default">panel</div>
  `,
})
class DerivedTokensHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(DerivedTokensHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`missing ${selector}`);
  }
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.style.removeProperty('--cngx-shadow-md');
});

describe('select-base theme-derived tokens', () => {
  it('paints the commit error hint in the danger text rung of the scheme', () => {
    const root = mount();
    for (const scheme of ['.scheme-default', '.scheme-dark']) {
      const hint = query(root, `${scheme} .cngx-select__commit-error-hint`);
      const probe = query(root, `${scheme} .probe`);
      expect(computedValue(hint, 'color')).toBe(computedValue(probe, 'color'));
    }
    const lightHint = query(root, '.scheme-default .cngx-select__commit-error-hint');
    const darkHint = query(root, '.scheme-dark .cngx-select__commit-error-hint');
    expect(computedValue(darkHint, 'color')).not.toBe(computedValue(lightHint, 'color'));
  });

  it('derives the panel shadow from the shadow scale in the default and light scheme', () => {
    const marker = 'rgb(255, 0, 0) 0px 2px 3px 0px';
    document.documentElement.style.setProperty('--cngx-shadow-md', marker);
    const root = mount();
    expect(computedValue(query(root, '.panel-default'), 'box-shadow')).toBe(marker);
    expect(computedValue(query(root, '.scheme-light .cngx-select__panel'), 'box-shadow')).toBe(
      marker,
    );
  });

  it('rounds the chip overflow badge with the chip radius', () => {
    const root = mount();
    expect(computedValue(query(root, '.badge-default'), 'border-top-left-radius')).toBe('999px');
    expect(computedValue(query(root, '.badge-themed'), 'border-top-left-radius')).toBe('3px');
  });
});
