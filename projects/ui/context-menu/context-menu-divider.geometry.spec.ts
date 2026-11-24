/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuDivider } from './context-menu-divider.component';
import { CngxContextMenuItem } from './context-menu-item.component';

// Runs in a real Chromium (the `test-geometry` target). The separator inset is
// registered `inherits: false`, so only a SET on the divider itself reaches
// the margin it feeds. density-tokens.css is loaded because without it
// --cngx-space-xs stays 4px, the same as the `@property` initial value, and
// the default case could not tell a dead cascade from a live one.

@Component({
  selector: 'cngx-context-menu-divider-host',
  standalone: true,
  imports: [CngxContextMenu, CngxContextMenuItem, CngxContextMenuDivider],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/density-tokens.css',
  ],
  // Unlayered, as a consumer override would be.
  styles: ['.override cngx-context-menu-divider { --cngx-context-menu-separator-inset: 10px; }'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (c of cases; track c.name) {
      <div [class]="c.name" [attr.data-density]="c.density">
        <cngx-context-menu ariaLabel="Edit">
          <cngx-context-menu-item value="cut">Cut</cngx-context-menu-item>
          <cngx-context-menu-divider />
          <cngx-context-menu-item value="paste">Paste</cngx-context-menu-item>
        </cngx-context-menu>
      </div>
    }
  `,
})
class DividerHost {
  readonly cases = [
    { name: 'default', density: null },
    { name: 'compact', density: 'compact' },
    { name: 'spacious', density: 'spacious' },
    { name: 'override', density: null },
  ];
}

let mountedRoot: HTMLElement | null = null;

function mount(): ReturnType<typeof TestBed.createComponent<DividerHost>> {
  const fixture = TestBed.createComponent(DividerHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return fixture;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxContextMenuDivider separator inset (real browser)', () => {
  it.each([
    ['default', '4px'],
    ['compact', '2px'],
    ['spacious', '6px'],
    ['override', '10px'],
  ])('the %s divider takes a %s block margin', async (name, expected) => {
    const fixture = mount();
    const menu = fixture.debugElement.query(By.css(`.${name} cngx-context-menu`));
    menu.injector.get(CngxContextMenu).popover.show();
    fixture.detectChanges();
    await fixture.whenStable();

    const divider = (menu.nativeElement as HTMLElement).querySelector('cngx-context-menu-divider');
    if (!divider) {
      throw new Error('divider did not render');
    }
    expect(computedValue(divider, 'margin-top')).toBe(expected);
    expect(computedValue(divider, 'margin-bottom')).toBe(expected);
  });
});
