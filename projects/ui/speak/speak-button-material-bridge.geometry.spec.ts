import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The speak button
// surface tokens are registered inherits:false and read on the inner button,
// so the Material bridge has to land them there, not only on the host. The
// markup is static (the classes the component renders) so the spec reads only
// the stylesheets.

@Component({
  selector: 'cngx-speak-button-material-bridge-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    './speak-button.css',
    './speak-button-material-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  // Bare host element: the bridge selects `cngx-speak-button` by tag.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cngx-speak-button class="cngx-speak-button">
      <button type="button" class="cngx-speak-button__btn resting"></button>
    </cngx-speak-button>
    <cngx-speak-button class="cngx-speak-button cngx-speak-button--speaking">
      <button type="button" class="cngx-speak-button__btn speaking"></button>
    </cngx-speak-button>
    <cngx-speak-button
      class="cngx-speak-button"
      style="--cngx-speak-btn-active-color: rgb(200, 10, 10)"
    >
      <button type="button" class="cngx-speak-button__btn host-override"></button>
    </cngx-speak-button>
  `,
})
class SpeakBridgeHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SpeakBridgeHost);
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
});

describe('speak button under the Material bridge', () => {
  it('puts the button on the bridged surface container', () => {
    const root = mount();
    expect(computedValue(query(root, '.resting'), 'background-color')).toBe('rgb(10, 20, 30)');
  });

  it('lets a host override of an inheriting token reach the button', () => {
    const root = mount();
    const button = query(root, '.host-override');
    expect(computedValue(button, '--cngx-speak-btn-active-color')).toBe('rgb(200, 10, 10)');
  });

  it('fills the speaking button with the bridged primary', () => {
    const root = mount();
    expect(computedValue(query(root, '.speaking'), 'background-color')).toBe('rgb(40, 50, 60)');
  });
});
