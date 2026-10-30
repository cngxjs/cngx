import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxMenuGroup } from '@cngx/common/interactive';
import { CNGX_ICON_CHECK, CNGX_ICON_DOT } from '@cngx/utils';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuItemCheckbox } from './context-menu-item-checkbox.component';
import { CngxContextMenuItemRadio } from './context-menu-item-radio.component';

@Component({
  template: `
    <cngx-context-menu ariaLabel="View">
      <cngx-context-menu-item-checkbox value="wrap" [(checked)]="wrap">
        Word wrap
      </cngx-context-menu-item-checkbox>
      <div cngxMenuGroup label="Density" [(selectedValue)]="density">
        <cngx-context-menu-item-radio value="cozy">Cozy</cngx-context-menu-item-radio>
        <cngx-context-menu-item-radio value="compact">Compact</cngx-context-menu-item-radio>
      </div>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuItemCheckbox, CngxContextMenuItemRadio, CngxMenuGroup],
})
class CheckableHost {
  readonly wrap = signal(false);
  readonly density = signal<string | undefined>(undefined);
}

describe('CngxContextMenuItemCheckbox / CngxContextMenuItemRadio', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<CheckableHost>>;
  let host: CheckableHost;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CheckableHost] });
    fixture = TestBed.createComponent(CheckableHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    host = fixture.componentInstance;
  });

  function checkbox(): HTMLElement {
    return fixture.nativeElement.querySelector('[role="menuitemcheckbox"]');
  }

  function radios(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="menuitemradio"]'));
  }

  it('toggles aria-checked and the two-way model on activation', () => {
    expect(checkbox().getAttribute('aria-checked')).toBe('false');

    checkbox().click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(checkbox().getAttribute('aria-checked')).toBe('true');
    expect(host.wrap()).toBe(true);

    checkbox().click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(checkbox().getAttribute('aria-checked')).toBe('false');
    expect(host.wrap()).toBe(false);
  });

  it('keeps radio selection mutually exclusive within the group', () => {
    const [cozy, compact] = radios();
    expect(cozy.getAttribute('aria-checked')).toBe('false');
    expect(compact.getAttribute('aria-checked')).toBe('false');

    cozy.click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(cozy.getAttribute('aria-checked')).toBe('true');
    expect(compact.getAttribute('aria-checked')).toBe('false');
    expect(host.density()).toBe('cozy');

    compact.click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(cozy.getAttribute('aria-checked')).toBe('false');
    expect(compact.getAttribute('aria-checked')).toBe('true');
    expect(host.density()).toBe('compact');
  });

  function indicatorPath(item: HTMLElement): string | null | undefined {
    return item.querySelector('.cngx-menu-item__check > svg.cngx-icon-svg path')?.getAttribute('d');
  }

  it('renders the checkbox tick from the shared icon only while checked', () => {
    expect(checkbox().querySelector('.cngx-menu-item__check')).not.toBeNull();
    expect(indicatorPath(checkbox())).toBeUndefined();

    checkbox().click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(indicatorPath(checkbox())).toBe(CNGX_ICON_CHECK.d);
  });

  it('renders the radio dot from the shared icon on the checked row only', () => {
    const [cozy, compact] = radios();
    cozy.click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(indicatorPath(cozy)).toBe(CNGX_ICON_DOT.d);
    expect(indicatorPath(compact)).toBeUndefined();
    expect(compact.querySelector('.cngx-menu-item__check')).not.toBeNull();
  });

  it('keeps the indicator gutter out of the accessibility tree', () => {
    checkbox().click();
    TestBed.flushEffects();
    fixture.detectChanges();
    const gutter = checkbox().querySelector('.cngx-menu-item__check');
    expect(gutter?.getAttribute('aria-hidden')).toBe('true');
    expect(checkbox().textContent?.trim()).toBe('Word wrap');
  });
});
