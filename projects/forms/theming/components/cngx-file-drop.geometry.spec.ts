/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The dropzone radius and
// success border are registered inherits: false with a fixed initial, so a
// use-site fallback never paints: the theme reaches them only through the host
// SET.

@Component({
  selector: 'cngx-file-drop-tokens-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    './cngx-file-drop.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="themed" style="--cngx-radius-md: 5px; --cngx-color-success: rgb(0, 128, 0)">
      <div class="cngx-file-drop cngx-file-drop--has-files">Drop files</div>
    </div>
  `,
})
class FileDropHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(FileDropHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('cngx-file-drop theme-derived tokens', () => {
  it('derives the radius and the success border from the theme', () => {
    const drop = mount().querySelector<HTMLElement>('.cngx-file-drop')!;
    expect(computedValue(drop, 'border-top-left-radius')).toBe('5px');
    expect(computedValue(drop, 'border-top-color')).toBe('rgb(0, 128, 0)');
  });
});
