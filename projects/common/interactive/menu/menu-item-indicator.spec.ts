import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CNGX_ICON_CHECK, CNGX_ICON_DOT } from '@cngx/utils';
import { describe, expect, it } from 'vitest';

import { CngxMenuGroup } from './menu-group.directive';
import { CngxMenuItemCheckbox } from './menu-item-checkbox.directive';
import { CNGX_MENU_ITEM_OWN_INDICATOR } from './menu-item-indicator';
import { CngxMenuItemRadio } from './menu-item-radio.directive';
import { CngxMenu } from './menu.directive';

@Component({
  template: `
    <ul cngxMenu [label]="'Format'" tabindex="0">
      <li cngxMenuItemCheckbox value="bold" [(checked)]="bold">Bold</li>
      <div cngxMenuGroup [label]="'Alignment'" name="align" [(selectedValue)]="align">
        <li cngxMenuItemRadio value="left">Left</li>
        <li cngxMenuItemRadio value="right">Right</li>
      </div>
    </ul>
  `,
  imports: [CngxMenu, CngxMenuGroup, CngxMenuItemCheckbox, CngxMenuItemRadio],
})
class IndicatorHost {
  readonly bold = signal(false);
  readonly align = signal<string>('left');
}

// A shell that applies the brain through hostDirectives keeps the base
// indicator; one that renders its own cue opts out through the token
// (ui/context-menu does).
@Component({
  selector: 'cngx-test-shell-item',
  template: `<ng-content />`,
  hostDirectives: [{ directive: CngxMenuItemCheckbox, inputs: ['checked'] }],
})
class ShellItem {}

@Component({
  selector: 'cngx-test-own-indicator-item',
  template: `<ng-content />`,
  hostDirectives: [{ directive: CngxMenuItemCheckbox, inputs: ['checked'] }],
  providers: [{ provide: CNGX_MENU_ITEM_OWN_INDICATOR, useValue: true }],
})
class OwnIndicatorItem {}

@Component({
  template: `
    <ul cngxMenu [label]="'Shell'" tabindex="0">
      <cngx-test-shell-item [checked]="true">Pinned</cngx-test-shell-item>
      <cngx-test-own-indicator-item [checked]="true">Starred</cngx-test-own-indicator-item>
    </ul>
  `,
  imports: [CngxMenu, ShellItem, OwnIndicatorItem],
})
class ShellHost {}

function render<T>(host: new () => T) {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  TestBed.flushEffects();
  return fixture;
}

function indicator(item: HTMLElement): HTMLElement | null {
  return item.querySelector(':scope > .cngx-menu-item__indicator');
}

describe('menu item checked indicator (base skin)', () => {
  it('inserts an aria-hidden check as the first child of a checked checkbox item', () => {
    const fixture = render(IndicatorHost);
    const item = fixture.debugElement.query(By.directive(CngxMenuItemCheckbox))
      .nativeElement as HTMLElement;
    expect(indicator(item)).toBeNull();

    fixture.componentInstance.bold.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = indicator(item);
    expect(el).not.toBeNull();
    expect(item.firstElementChild).toBe(el);
    expect(el?.getAttribute('aria-hidden')).toBe('true');
    expect(el?.textContent).toBe('');
    const svg = el?.querySelector('svg.cngx-menu-item__indicator-svg');
    expect(svg?.getAttribute('viewBox')).toBe(CNGX_ICON_CHECK.viewBox);
    expect(svg?.classList.contains('cngx-menu-item__indicator-svg--stroke')).toBe(true);
    expect(svg?.querySelector('path')?.getAttribute('d')).toBe(CNGX_ICON_CHECK.d);
  });

  it('removes the indicator when the item unchecks and keeps the label text', () => {
    const fixture = render(IndicatorHost);
    const debug = fixture.debugElement.query(By.directive(CngxMenuItemCheckbox));
    const item = debug.nativeElement as HTMLElement;
    fixture.componentInstance.bold.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(debug.injector.get(CngxMenuItemCheckbox).label()).toBe('Bold');

    fixture.componentInstance.bold.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(indicator(item)).toBeNull();
    expect(item.textContent?.trim()).toBe('Bold');
  });

  it('draws a fill dot on the selected radio item only, and follows the selection', () => {
    const fixture = render(IndicatorHost);
    const [left, right] = fixture.debugElement
      .queryAll(By.directive(CngxMenuItemRadio))
      .map((d) => d.nativeElement as HTMLElement);
    const svg = indicator(left)?.querySelector('svg');
    expect(svg?.querySelector('path')?.getAttribute('d')).toBe(CNGX_ICON_DOT.d);
    expect(svg?.classList.contains('cngx-menu-item__indicator-svg--stroke')).toBe(false);
    expect(indicator(right)).toBeNull();

    fixture.componentInstance.align.set('right');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(indicator(left)).toBeNull();
    expect(indicator(right)).not.toBeNull();
  });

  it('keeps the indicator on a hostDirectives shell unless it opts out', () => {
    const fixture = render(ShellHost);
    const shell = fixture.nativeElement.querySelector('cngx-test-shell-item') as HTMLElement;
    const own = fixture.nativeElement.querySelector('cngx-test-own-indicator-item') as HTMLElement;
    expect(shell.getAttribute('aria-checked')).toBe('true');
    expect(indicator(shell)).not.toBeNull();
    expect(own.getAttribute('aria-checked')).toBe('true');
    expect(own.querySelector('.cngx-menu-item__indicator')).toBeNull();
  });

  it('paints the glyph by presentation attributes, so it needs no stylesheet', () => {
    const fixture = render(IndicatorHost);
    const item = fixture.debugElement.query(By.directive(CngxMenuItemRadio))
      .nativeElement as HTMLElement;
    const svg = indicator(item)?.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });
});
