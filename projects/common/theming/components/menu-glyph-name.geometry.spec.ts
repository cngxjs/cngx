import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CngxMenu,
  CngxMenuGroup,
  CngxMenuItemCheckbox,
  CngxMenuItemRadio,
} from '@cngx/common/interactive';
import { afterEach, describe, expect, it } from 'vitest';
import { accessibleName } from '@cngx/testing/geometry';

// Runs in a real Chromium (the `test-geometry` target). The checked tick and
// dot are an svg indicator the item directive inserts into the item, so
// without aria-hidden Chromium could fold it into the accessible name. The
// name is read from the browser's own accessibility tree, not from computed
// styles.

@Component({
  selector: 'cngx-menu-glyph-name-host',
  standalone: true,
  imports: [CngxMenu, CngxMenuGroup, CngxMenuItemCheckbox, CngxMenuItemRadio],
  styleUrls: ['../../../core/theming/system-tokens.css', './cngx-menu.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ul cngxMenu [label]="'Format'" tabindex="0">
      <li cngxMenuItemCheckbox value="bold" [checked]="true" class="item-check">
        <span class="cngx-menu-item__label">Bold</span>
      </li>
      <div cngxMenuGroup [label]="'Alignment'" name="align" selectedValue="left">
        <li cngxMenuItemRadio value="left" class="item-radio">
          <span class="cngx-menu-item__label">Left</span>
        </li>
      </div>
    </ul>
  `,
})
class MenuGlyphNameHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): void {
  const fixture = TestBed.createComponent(MenuGlyphNameHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('checked menu glyphs', () => {
  it('stay visible', () => {
    mount();
    for (const selector of ['.item-check', '.item-radio']) {
      const svg = mountedRoot!.querySelector(`${selector} .cngx-menu-item__indicator-svg`);
      expect(svg?.getBoundingClientRect().width).toBeGreaterThan(0);
    }
  });

  it('keep the tick out of a checked checkbox item name', async () => {
    mount();
    expect(await accessibleName('.item-check')).toBe('Bold');
  });

  it('keep the dot out of a checked radio item name', async () => {
    mount();
    expect(await accessibleName('.item-radio')).toBe('Left');
  });
});
