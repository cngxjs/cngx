/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target) against the compiled
// option Material bridge (option-bridge-padding.spec-host.scss). The listbox
// skin SETs the option padding from the scale in the nested
// `cngx.components.skin` layer, so the bridge value lands on a bare
// `[cngxOption]`: M3 12px block / 16px inline at comfortable density.

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

describe('option Material bridge padding', () => {
  it('pads a bare option with the M3 12px block inset', () => {
    expect(computedValue(mountRow(), 'padding-top')).toBe('12px');
  });

  it('pads a bare option with the M3 16px inline inset', () => {
    expect(computedValue(mountRow(), 'padding-left')).toBe('16px');
  });
});
