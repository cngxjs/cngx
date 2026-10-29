import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CNGX_ICON_CHECK, CNGX_ICON_DOT } from '@cngx/utils';
import { describe, expect, it } from 'vitest';

import { CngxMenuGroup } from './menu-group.directive';
import { CngxMenuItemCheckbox } from './menu-item-checkbox.directive';
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

// An organism shell that applies the brain through hostDirectives renders its
// own indicator (ui/context-menu does), so the base one must stay out.
@Component({
  selector: 'cngx-test-shell-item',
  template: `<ng-content />`,
  hostDirectives: [{ directive: CngxMenuItemCheckbox, inputs: ['checked'] }],
})
class ShellItem {}

@Component({
  template: `
    <ul cngxMenu [label]="'Shell'" tabindex="0">
      <cngx-test-shell-item [checked]="true">Pinned</cngx-test-shell-item>
    </ul>
  `,
  imports: [CngxMenu, ShellItem],
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

  it('leaves a hostDirectives shell to render its own indicator', () => {
    const fixture = render(ShellHost);
    const item = fixture.nativeElement.querySelector('cngx-test-shell-item') as HTMLElement;
    expect(item.getAttribute('aria-checked')).toBe('true');
    expect(item.querySelector('.cngx-menu-item__indicator')).toBeNull();
  });
});
