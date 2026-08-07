import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxToggle } from './toggle.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-toggle)` block (toggle.component.css:259) lays the track + label on
// one inline-flex line, floors the block axis to `--cngx-target-min`, sizes a
// rigid track that hosts an absolutely-positioned thumb, and reverses the row
// under `--label-before`. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxToggle],
  template: `<cngx-toggle [labelPosition]="labelPosition">Notify</cngx-toggle>`,
})
class ToggleHost {
  labelPosition: 'before' | 'after' = 'after';
}

function mount(labelPosition: 'before' | 'after' = 'after'): HTMLElement {
  const fixture = TestBed.createComponent(ToggleHost);
  fixture.componentInstance.labelPosition = labelPosition;
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-toggle');
  if (!host) {
    throw new Error('cngx-toggle did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxToggle geometry', () => {
  it('lays the track and label on one inline-flex line', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('inline-flex');
    expect(computedValue(host, 'align-items')).toBe('center');
    // Only the block axis is floored - the track is intrinsically wide.
    host.style.setProperty('--cngx-target-min', '44px');
    expect(computedValue(host, 'min-block-size')).toBe('44px');
  });

  it('anchors the thumb inside a rigid track', () => {
    const host = mount();
    const track = query(host, '.cngx-toggle__track');
    expect(computedValue(track, 'position')).toBe('relative');
    expect(computedValue(track, 'flex-grow')).toBe('0');
    expect(computedValue(track, 'flex-shrink')).toBe('0');
    // The thumb is absolutely placed against the track.
    expect(computedValue(query(host, '.cngx-toggle__thumb'), 'position')).toBe('absolute');
  });

  it('reverses the row under label-before', () => {
    const host = mount('before');
    expect(computedValue(host, 'flex-direction')).toBe('row-reverse');
  });
});
