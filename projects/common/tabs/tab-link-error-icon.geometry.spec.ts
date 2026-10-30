import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTabGroupPresenter } from './presenter.directive';
import { CngxTabLink } from './tab-link.directive';

// Runs in a real Chromium (the `test-geometry` target). A bare `[cngxTabLink]`
// under a headless `[cngxTabGroup]` host loads no tab stylesheet, so the alert
// icon it builds must size and paint itself: a 1em box in the link font,
// stroked in the link colour, never the 300x150 default of an unsized svg.

@Component({
  selector: 'cngx-bare-tab-link-host',
  standalone: true,
  imports: [CngxTabLink],
  hostDirectives: [CngxTabGroupPresenter],
  template: `
    <a cngxTabLink id="overview" href="#" style="font-size: 20px; color: rgb(200, 0, 0)">
      Overview
    </a>
    <a cngxTabLink id="profile" href="#" [error]="true" style="font-size: 20px; color: rgb(200, 0, 0)">
      Profile
    </a>
  `,
})
class BareHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): SVGSVGElement {
  const fixture = TestBed.createComponent(BareHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot.querySelector<SVGSVGElement>('#profile .cngx-tab-link__error-icon > svg')!;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('bare tab link error icon', () => {
  it('sizes itself to 1em of the link font', () => {
    const box = mount().getBoundingClientRect();
    expect(box.width).toBeCloseTo(20, 0);
    expect(box.height).toBeCloseTo(20, 0);
  });

  it('strokes the outline in the link colour and leaves the area unfilled', () => {
    const style = getComputedStyle(mount());
    expect(style.fill).toBe('none');
    expect(style.stroke).toBe('rgb(200, 0, 0)');
    expect(style.strokeWidth).toBe('2px');
  });
});
