import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxMenuItemIcon } from '@cngx/common/interactive';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuItem } from './context-menu-item.component';

@Component({
  template: `
    <cngx-context-menu ariaLabel="Icons">
      <cngx-context-menu-item value="string" icon="★">Shorthand</cngx-context-menu-item>
      <cngx-context-menu-item value="projected">
        <svg cngxMenuItemIcon data-marker></svg>
        Projected
      </cngx-context-menu-item>
      <cngx-context-menu-item value="both" icon="★">
        <svg cngxMenuItemIcon data-marker></svg>
        Both
      </cngx-context-menu-item>
      <button cngxContextMenuItem value="attr">
        <svg cngxMenuItemIcon data-marker></svg>
        Attribute
      </button>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuItem, CngxMenuItemIcon],
})
class IconHost {}

describe('CngxContextMenuItem icon slot', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<IconHost>>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [IconHost] });
    fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  });

  const INDEX = { string: 0, projected: 1, both: 2, attr: 3 } as const;

  function item(value: keyof typeof INDEX): HTMLElement {
    const root = fixture.nativeElement as HTMLElement;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    return items[INDEX[value]];
  }

  function icons(value: keyof typeof INDEX): HTMLElement[] {
    return Array.from(item(value).querySelectorAll<HTMLElement>('.cngx-menu-item__icon'));
  }

  it('renders the string [icon] shorthand into the icon slot when no marker is projected', () => {
    const rendered = icons('string');
    expect(rendered).toHaveLength(1);
    expect(rendered[0].tagName.toLowerCase()).toBe('span');
    expect(rendered[0].textContent).toContain('★');
  });

  it('projects a [cngxMenuItemIcon] marker into the icon slot', () => {
    const rendered = icons('projected');
    expect(rendered).toHaveLength(1);
    expect(rendered[0].tagName.toLowerCase()).toBe('svg');
    expect(rendered[0].hasAttribute('data-marker')).toBe(true);
  });

  it('suppresses the string shorthand when a marker is projected (marker wins)', () => {
    const rendered = icons('both');
    expect(rendered).toHaveLength(1);
    expect(rendered[0].tagName.toLowerCase()).toBe('svg');
    expect(item('both').textContent).not.toContain('★');
  });

  it('projects the marker on the button-attribute selector form too', () => {
    const rendered = icons('attr');
    expect(rendered).toHaveLength(1);
    expect(rendered[0].tagName.toLowerCase()).toBe('svg');
  });
});
