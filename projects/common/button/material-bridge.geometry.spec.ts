import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxIcon } from '@cngx/common/display';

import { CngxButton } from './button.component';
import type { CngxButtonSize } from './button.types';
import { CngxCloseButton } from './close-button.component';
import { CngxIconButton } from './icon-button.component';
import { CngxButtonStart } from './slots';

// Runs in a real Chromium (the `test-geometry` target). Material styles
// `.mat-icon` unlayered at 24px, which beats the layered slot and glyph rules,
// so without a bridge a <mat-icon> stays 24px at every button size. The
// pattern is a <mat-icon> wrapped in <cngx-icon>; the icon bridge
// (material-bridge.spec-host.scss compiles icon-theme.scss) sizes the wrapped
// glyph to the cngx-icon rung, which is the size the svg glyph has in the same
// place. Material's stylesheet is not loaded here:
// its `.mat-icon` rule and the icon font's `.material-icons` rule are copied
// below and appended after the component styles, the worst case for order.

const MATERIAL_ICON_RULES = `
.mat-icon {
  -webkit-user-select: none;
  user-select: none;
  background-repeat: no-repeat;
  display: inline-block;
  fill: currentColor;
  height: 24px;
  width: 24px;
  overflow: hidden;
}
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  display: inline-block;
  white-space: nowrap;
}
`;

const SIZES: readonly CngxButtonSize[] = ['xs', 'sm', 'md', 'lg'];

@Component({
  selector: 'cngx-material-bridge-geometry-host',
  standalone: true,
  imports: [CngxButton, CngxButtonStart, CngxIconButton, CngxCloseButton, CngxIcon],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    './material-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (size of sizes; track size) {
      <p>
        <button cngxButton class="slot-svg-{{ size }}" [size]="size">
          <svg cngxButtonStart viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
        <button cngxButton class="slot-mat-{{ size }}" [size]="size">
          <cngx-icon cngxButtonStart
            ><span class="mat-icon notranslate material-icons mat-ligature-font" aria-hidden="true"
              >add</span
            ></cngx-icon
          >
          Add
        </button>
      </p>
      <p>
        <button cngxIconButton class="icon-svg-{{ size }}" [size]="size" aria-label="Add">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button cngxIconButton class="icon-mat-{{ size }}" [size]="size" aria-label="Add">
          <cngx-icon
            ><span class="mat-icon notranslate material-icons mat-ligature-font">add</span></cngx-icon
          >
        </button>
        <button
          cngxCloseButton
          class="close-svg-{{ size }}"
          [size]="size"
          aria-label="Close"
        ></button>
        <button cngxCloseButton class="close-mat-{{ size }}" [size]="size" aria-label="Close">
          <cngx-icon
            ><span class="mat-icon notranslate material-icons mat-ligature-font">close</span></cngx-icon
          >
        </button>
      </p>
    }
  `,
})
class MaterialBridgeGeometryHost {
  readonly sizes = SIZES;
}

let mountedRoot: HTMLElement | null = null;
let materialRules: HTMLStyleElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MaterialBridgeGeometryHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  materialRules = document.createElement('style');
  materialRules.textContent = MATERIAL_ICON_RULES;
  document.head.appendChild(materialRules);
  return mountedRoot;
}

function box(root: ParentNode, selector: string): { width: number; height: number } {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  const rect = el.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  materialRules?.remove();
  materialRules = null;
});

describe('Material bridge: wrapped mat-icon in the button family', () => {
  it.each(SIZES)('a wrapped mat-icon in a start slot matches the svg glyph at %s', (size) => {
    const root = mount();
    const svg = box(root, `.slot-svg-${size} svg`);
    expect(svg.width).toBeGreaterThan(0);
    expect(box(root, `.slot-mat-${size} .mat-icon`)).toEqual(svg);
  });

  it.each(SIZES)('a wrapped mat-icon in an icon button matches the svg glyph at %s', (size) => {
    const root = mount();
    const svg = box(root, `.icon-svg-${size} svg`);
    expect(svg.width).toBeGreaterThan(0);
    expect(box(root, `.icon-mat-${size} .mat-icon`)).toEqual(svg);
  });

  it.each(SIZES)('a wrapped mat-icon in a close button matches the default X glyph at %s', (size) => {
    const root = mount();
    const svg = box(root, `.close-svg-${size} svg`);
    expect(svg.width).toBeGreaterThan(0);
    expect(box(root, `.close-mat-${size} .mat-icon`)).toEqual(svg);
  });

  it('leaves the 24px Material default behind at the small sizes', () => {
    const root = mount();
    expect(box(root, '.slot-mat-xs .mat-icon').width).toBeLessThan(24);
    expect(box(root, '.icon-mat-xs .mat-icon').width).toBeLessThan(24);
  });
});
