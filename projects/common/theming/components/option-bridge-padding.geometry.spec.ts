/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target) against the compiled
// option Material bridge (option-bridge-padding.spec-host.scss). The listbox
// skin SETs the option padding from the scale in the nested
// `cngx.components.skin` layer, so the bridge values land on a bare
// `[cngxOption]`. The twin is mat-option: no block padding, 16px inline, and
// a 48px row from its min height at comfortable density.

@Component({
  selector: 'cngx-option-bridge-padding-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    './cngx-listbox.css',
    './option-bridge-padding.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div cngxListbox role="listbox">
      <div cngxOption role="option" class="row">Red</div>
    </div>
  `,
})
class OptionBridgePaddingHost {}

let mountedRoot: HTMLElement | null = null;

function mountRow(): HTMLElement {
  const fixture = TestBed.createComponent(OptionBridgePaddingHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const row = mountedRoot.querySelector<HTMLElement>('.row');
  if (!row) {
    throw new Error('.row did not render');
  }
  return row;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('option Material bridge metrics', () => {
  it('drops the block padding like mat-option', () => {
    expect(computedValue(mountRow(), 'padding-top')).toBe('0px');
  });

  it('pads a bare option with the 16px inline inset', () => {
    expect(computedValue(mountRow(), 'padding-left')).toBe('16px');
  });

  it('gives a bare option the 48px mat-option row', () => {
    expect(mountRow().getBoundingClientRect().height).toBe(48);
  });
});
