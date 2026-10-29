import { Component, ViewEncapsulation } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { CngxButton } from '@cngx/common/button';
import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { afterEach, describe, expect, it } from 'vitest';

import { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';
import { CngxIconMenuButton } from './icon-menu-button.component';
import { CngxMenuButton } from './menu-button.component';
import { CngxSplitButton } from './split-button.directive';

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// button bridge (`../button/material-bridge.spec-host.scss`). A menu button
// reads like `mat-button` / `mat-flat-button` with a trailing `arrow_drop_down`
// at comfortable; a split button follows the M3 split-button anatomy.

const M3 = {
  height: 40,
  inline: 24,
  text: 12,
  slot: 16,
  slotIcon: 18,
  gap: 2,
  inner: 4,
};

@Component({
  selector: 'cngx-menu-button-material-bridge-host',
  standalone: true,
  imports: [CngxButton, CngxMenuButton, CngxIconMenuButton, CngxSplitButton, CngxMenu, CngxMenuItem, CngxPopover],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    '../theming/components/cngx-button-group.css',
    '../button/material-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (density of densities; track density) {
      <div [attr.data-density]="density">
        <p>
          <button cngxMenuButton tone="primary" class="solid-{{ density }}" [menu]="menu" [popover]="pop">
            Export
          </button>
          <button cngxMenuButton="ghost" class="ghost-{{ density }}" [menu]="menu" [popover]="pop">
            Export
          </button>
        </p>
        <p>
          <span cngxSplitButton variant="solid" class="split-{{ density }}" aria-label="Publish">
            <button cngxButton tone="primary" class="main-{{ density }}">Publish</button>
            <button
              cngxIconMenuButton
              tone="primary"
              class="caret-{{ density }}"
              [menu]="menu"
              [popover]="pop"
            ></button>
          </span>
        </p>
      </div>
    }
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Export format'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="pdf">PDF</li>
      </ul>
    </div>
  `,
})
class MaterialBridgeMenuButtonHost {
  readonly densities = ['comfortable', 'compact', 'spacious'] as const;
}

// A Material caret through CNGX_BUTTON_CARET_ICON: the component host sits
// between the caret <cngx-icon> and the glyph. Material's `.mat-icon` rule is
// copied in after the component styles (the worst case for order), as in the
// button bridge geometry spec.
const MATERIAL_ICON_RULE = `
.mat-icon {
  display: inline-block;
  height: 24px;
  width: 24px;
  overflow: hidden;
}
.material-icons {
  font-size: 24px;
  line-height: 1;
}
`;

@Component({
  selector: 'cngx-geometry-mat-caret',
  standalone: true,
  template: `<span class="mat-icon notranslate material-icons mat-ligature-font">arrow_drop_down</span>`,
})
class MatCaret {}

@Component({
  selector: 'cngx-menu-button-material-caret-host',
  standalone: true,
  imports: [CngxMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
  viewProviders: [{ provide: CNGX_BUTTON_CARET_ICON, useValue: MatCaret }],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    '../button/material-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button cngxMenuButton tone="primary" class="mat-caret" [menu]="menu" [popover]="pop">Export</button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Export format'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="pdf">PDF</li>
      </ul>
    </div>
  `,
})
class MaterialCaretHost {}

let materialRule: HTMLStyleElement | null = null;
let mountedRoot: HTMLElement | null = null;
let fixture: ComponentFixture<MaterialBridgeMenuButtonHost> | null = null;

function mount(): HTMLElement {
  fixture = TestBed.createComponent(MaterialBridgeMenuButtonHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  return mountedRoot;
}

function query(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

function radii(el: Element): { startStart: number; endStart: number; startEnd: number; endEnd: number } {
  const style = getComputedStyle(el);
  return {
    startStart: parseFloat(style.borderStartStartRadius),
    endStart: parseFloat(style.borderEndStartRadius),
    startEnd: parseFloat(style.borderStartEndRadius),
    endEnd: parseFloat(style.borderEndEndRadius),
  };
}

function seam(root: ParentNode, density: string): number {
  const main = query(root, `.main-${density}`).getBoundingClientRect();
  const caret = query(root, `.caret-${density}`).getBoundingClientRect();
  return caret.left - main.right;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  fixture = null;
  materialRule?.remove();
  materialRule = null;
});

describe('Material bridge: menu button', () => {
  it('pads the caret side like a M3 trailing icon (16 / 24 filled, 12 / 16 text)', () => {
    const root = mount();
    const solid = getComputedStyle(query(root, '.solid-comfortable'));
    expect([parseFloat(solid.paddingInlineStart), parseFloat(solid.paddingInlineEnd)]).toEqual([
      M3.inline,
      M3.slot,
    ]);
    const ghost = getComputedStyle(query(root, '.ghost-comfortable'));
    expect([parseFloat(ghost.paddingInlineStart), parseFloat(ghost.paddingInlineEnd)]).toEqual([
      M3.slot,
      M3.text,
    ]);
    expect(query(root, '.solid-comfortable').getBoundingClientRect().height).toBe(M3.height);
  });

  it('centres the caret on the label line', () => {
    const root = mount();
    for (const selector of ['.solid-comfortable', '.ghost-comfortable']) {
      const button = query(root, selector).getBoundingClientRect();
      const caret = query(root, `${selector} .cngx-menu-button__caret`).getBoundingClientRect();
      expect(caret.top + caret.height / 2, selector).toBeCloseTo(button.top + button.height / 2, 0);
    }
  });

  it('sizes the caret as the 18px M3 slot icon', () => {
    const caret = query(mount(), '.solid-comfortable .cngx-menu-button__caret').getBoundingClientRect();
    expect(caret.width).toBeCloseTo(M3.slotIcon, 1);
    expect(caret.height).toBeCloseTo(M3.slotIcon, 1);
  });

  it('sizes a wrapped mat-icon caret from CNGX_BUTTON_CARET_ICON as the 18px slot icon', () => {
    const caretFixture = TestBed.createComponent(MaterialCaretHost);
    mountedRoot = caretFixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    caretFixture.detectChanges();
    materialRule = document.createElement('style');
    materialRule.textContent = MATERIAL_ICON_RULE;
    document.head.appendChild(materialRule);
    const glyph = query(mountedRoot, '.mat-caret .cngx-menu-button__caret .mat-icon').getBoundingClientRect();
    expect(glyph.width).toBeCloseTo(M3.slotIcon, 1);
    expect(glyph.height).toBeCloseTo(M3.slotIcon, 1);
    // The caret component's host adds no baseline gap: glyph and caret share a centre.
    const caret = query(mountedRoot, '.mat-caret .cngx-menu-button__caret').getBoundingClientRect();
    expect(caret.height).toBeCloseTo(M3.slotIcon, 1);
    const button = query(mountedRoot, '.mat-caret').getBoundingClientRect();
    expect(glyph.top + glyph.height / 2).toBeCloseTo(button.top + button.height / 2, 0);
  });

  it('honours --cngx-menu-button-caret-size under the bridge', () => {
    const root = mount();
    const button = query(root, '.solid-comfortable');
    button.style.setProperty('--cngx-menu-button-caret-size', '24px');
    const caret = query(button, '.cngx-menu-button__caret').getBoundingClientRect();
    expect(caret.width).toBeCloseTo(24, 1);
  });
});

describe('Material bridge: split button', () => {
  it('opens a 2px seam and rounds the inner joins to corner-extra-small at comfortable', () => {
    const root = mount();
    expect(seam(root, 'comfortable')).toBeCloseTo(M3.gap, 1);
    const main = radii(query(root, '.main-comfortable'));
    const caret = radii(query(root, '.caret-comfortable'));
    expect(main.startStart).toBeGreaterThan(1000);
    expect(main.endStart).toBeGreaterThan(1000);
    expect([main.startEnd, main.endEnd]).toEqual([M3.inner, M3.inner]);
    expect([caret.startStart, caret.endStart]).toEqual([M3.inner, M3.inner]);
    expect(caret.startEnd).toBeGreaterThan(1000);
    expect(caret.endEnd).toBeGreaterThan(1000);
  });

  it('keeps both parts on the M3 40px row', () => {
    const root = mount();
    expect(query(root, '.main-comfortable').getBoundingClientRect().height).toBe(M3.height);
    const caret = query(root, '.caret-comfortable').getBoundingClientRect();
    expect([caret.width, caret.height]).toEqual([M3.height, M3.height]);
  });

  it('re-scales the seam with the density islands', () => {
    const root = mount();
    expect(seam(root, 'compact')).toBeCloseTo(1, 1);
    expect(seam(root, 'spacious')).toBeCloseTo(3, 1);
  });

  it('keeps the inner corners while the caret is open', () => {
    const root = mount();
    const caret = query(root, '.caret-comfortable');
    caret.click();
    TestBed.flushEffects();
    fixture?.detectChanges();
    expect(caret.getAttribute('data-expanded')).toBe('true');
    const open = radii(caret);
    expect([open.startStart, open.endStart]).toEqual([M3.inner, M3.inner]);
  });

  it('draws no seam line between two solid parts (the gap divides)', () => {
    const caret = getComputedStyle(query(mount(), '.caret-comfortable'));
    expect(caret.borderInlineStartColor).toBe(caret.backgroundColor);
  });
});
