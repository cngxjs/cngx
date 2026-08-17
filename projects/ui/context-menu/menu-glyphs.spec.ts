import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxMenuGroup } from '@cngx/common/interactive';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuItem } from './context-menu-item.component';
import { CngxContextMenuItemCheckbox } from './context-menu-item-checkbox.component';
import { CngxContextMenuItemRadio } from './context-menu-item-radio.component';
import { CNGX_MENU_GLYPHS, type CngxMenuGlyphKey } from './menu-glyphs';

describe('CNGX_MENU_GLYPHS', () => {
  it('exposes the three menu glyph keys', () => {
    expect(Object.keys(CNGX_MENU_GLYPHS).sort()).toEqual([
      'checkboxChecked',
      'radioChecked',
      'submenuCaret',
    ]);
  });

  it('every glyph is a non-empty string', () => {
    for (const key of Object.keys(CNGX_MENU_GLYPHS) as CngxMenuGlyphKey[]) {
      expect(typeof CNGX_MENU_GLYPHS[key]).toBe('string');
      expect(CNGX_MENU_GLYPHS[key].length).toBeGreaterThan(0);
    }
  });

  it('returns the canonical default glyph strings', () => {
    expect(CNGX_MENU_GLYPHS.submenuCaret).toBe('▸');
    expect(CNGX_MENU_GLYPHS.checkboxChecked).toBe('✓');
    expect(CNGX_MENU_GLYPHS.radioChecked).toBe('●');
  });
});

@Component({
  template: `
    <cngx-context-menu ariaLabel="Actions">
      <cngx-context-menu-item value="export" [submenu]="sub">Export</cngx-context-menu-item>
      <cngx-context-menu-item-checkbox value="wrap" [(checked)]="wrap">
        Word wrap
      </cngx-context-menu-item-checkbox>
      <div cngxMenuGroup label="Density" [(selectedValue)]="density">
        <cngx-context-menu-item-radio value="cozy">Cozy</cngx-context-menu-item-radio>
      </div>
    </cngx-context-menu>

    <cngx-context-menu ariaLabel="Export as" #sub="cngxContextMenu">
      <cngx-context-menu-item value="pdf">PDF</cngx-context-menu-item>
    </cngx-context-menu>
  `,
  imports: [
    CngxContextMenu,
    CngxContextMenuItem,
    CngxContextMenuItemCheckbox,
    CngxContextMenuItemRadio,
    CngxMenuGroup,
  ],
})
class GlyphHost {
  readonly wrap = signal(false);
  readonly density = signal<string | undefined>(undefined);
}

describe('context-menu glyphs resolve from CNGX_MENU_GLYPHS', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<GlyphHost>>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GlyphHost] });
    fixture = TestBed.createComponent(GlyphHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  });

  it('renders the submenu caret from the const', () => {
    const root = fixture.nativeElement as HTMLElement;
    const suffix = root.querySelector('.cngx-menu-item__suffix');
    expect(suffix?.textContent?.trim()).toBe(CNGX_MENU_GLYPHS.submenuCaret);
  });

  it('seeds the checkbox indicator glyph from the const', () => {
    const root = fixture.nativeElement as HTMLElement;
    const checkbox = root.querySelector<HTMLElement>('cngx-context-menu-item-checkbox');
    expect(checkbox?.style.getPropertyValue('--cngx-context-menu-item-check-glyph')).toBe(
      `'${CNGX_MENU_GLYPHS.checkboxChecked}'`,
    );
  });

  it('seeds the radio indicator glyph from the const', () => {
    const root = fixture.nativeElement as HTMLElement;
    const radio = root.querySelector<HTMLElement>('cngx-context-menu-item-radio');
    expect(radio?.style.getPropertyValue('--cngx-context-menu-item-check-glyph')).toBe(
      `'${CNGX_MENU_GLYPHS.radioChecked}'`,
    );
  });
});
