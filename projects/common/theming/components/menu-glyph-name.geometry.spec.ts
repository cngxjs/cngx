import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { accessibleName } from '@cngx/testing/geometry';

// Runs in a real Chromium (the `test-geometry` target). The checked tick and
// dot are `::before` content of the item, so without CSS alt text Chromium
// folds them into the accessible name ("✓ Bold"). The name is read from the
// browser's own accessibility tree, not from computed styles.

@Component({
  selector: 'cngx-menu-glyph-name-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './cngx-menu.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ul cngxMenu role="menu">
      <li cngxMenuItemCheckbox role="menuitemcheckbox" class="cngx-menu-item--checked item-check">
        <span class="cngx-menu-item__label">Bold</span>
      </li>
      <li cngxMenuItemRadio role="menuitemradio" class="cngx-menu-item--checked item-radio">
        <span class="cngx-menu-item__label">Left</span>
      </li>
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
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('checked menu glyphs', () => {
  it('stay visible', () => {
    mount();
    const tick = getComputedStyle(mountedRoot!.querySelector('.item-check')!, '::before');
    expect(tick.content).toContain('✓');
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
