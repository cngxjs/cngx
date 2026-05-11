import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxMenuItem } from './menu-item.directive';
import { CngxMenuSeparator } from './menu-separator.directive';
import { CngxMenu } from './menu.directive';

@Component({
  template: `
    <ul cngxMenu [label]="'Edit'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="cut">Cut</li>
      <li cngxMenuItem value="copy">Copy</li>
      <li cngxMenuSeparator></li>
      <li cngxMenuItem value="paste">Paste</li>
    </ul>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuSeparator],
})
class SeparatorHost {
  readonly probe = signal(0);
}

describe('CngxMenuSeparator', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SeparatorHost] }));

  it('renders role="separator" with horizontal orientation', () => {
    const fixture = TestBed.createComponent(SeparatorHost);
    fixture.detectChanges();
    const sep = fixture.debugElement.query(By.directive(CngxMenuSeparator))
      .nativeElement as HTMLElement;
    expect(sep.getAttribute('role')).toBe('separator');
    expect(sep.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('is skipped by ArrowDown navigation between items', () => {
    const fixture = TestBed.createComponent(SeparatorHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const menu = fixture.debugElement.query(By.directive(CngxMenu)).injector.get(CngxMenu);
    const hostEl = fixture.debugElement.query(By.directive(CngxMenu))
      .nativeElement as HTMLElement;

    menu.ad.highlightByValue('copy');
    TestBed.flushEffects();
    expect(menu.ad.activeValue()).toBe('copy');

    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(menu.ad.activeValue()).toBe('paste');
  });
});
