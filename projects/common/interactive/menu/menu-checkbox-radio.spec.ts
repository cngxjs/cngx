import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxMenuGroup } from './menu-group.directive';
import { CngxMenuItemCheckbox } from './menu-item-checkbox.directive';
import { CngxMenuItemRadio } from './menu-item-radio.directive';
import { CngxMenu } from './menu.directive';

@Component({
  template: `
    <ul cngxMenu [label]="'View'" tabindex="0">
      <li cngxMenuItemCheckbox value="bold" [(checked)]="bold">Bold</li>
      <li cngxMenuItemCheckbox value="italic" [(checked)]="italic">Italic</li>
    </ul>
  `,
  imports: [CngxMenu, CngxMenuItemCheckbox],
})
class CheckboxHost {
  readonly bold = signal(false);
  readonly italic = signal(true);
}

describe('CngxMenuItemCheckbox', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [CheckboxHost] }));

  it('sets role=menuitemcheckbox and aria-checked', () => {
    const fixture = TestBed.createComponent(CheckboxHost);
    fixture.detectChanges();
    const items = fixture.debugElement
      .queryAll(By.directive(CngxMenuItemCheckbox))
      .map((d) => d.nativeElement as HTMLElement);
    expect(items[0].getAttribute('role')).toBe('menuitemcheckbox');
    expect(items[0].getAttribute('aria-checked')).toBe('false');
    expect(items[1].getAttribute('aria-checked')).toBe('true');
  });

  it('click toggles checked state', () => {
    const fixture = TestBed.createComponent(CheckboxHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const items = fixture.debugElement
      .queryAll(By.directive(CngxMenuItemCheckbox))
      .map((d) => d.nativeElement as HTMLElement);
    items[0].click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(fixture.componentInstance.bold()).toBe(true);
    expect(items[0].getAttribute('aria-checked')).toBe('true');
  });
});

@Component({
  template: `
    <ul cngxMenu [label]="'Alignment'" tabindex="0">
      <div cngxMenuGroup [label]="'Alignment'" name="align">
        <li cngxMenuItemRadio value="left">Left</li>
        <li cngxMenuItemRadio value="center">Center</li>
        <li cngxMenuItemRadio value="right">Right</li>
      </div>
    </ul>
  `,
  imports: [CngxMenu, CngxMenuGroup, CngxMenuItemRadio],
})
class RadioHost {}

describe('CngxMenuItemRadio', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [RadioHost] }));

  it('renders group role and menuitemradio ARIA', () => {
    const fixture = TestBed.createComponent(RadioHost);
    fixture.detectChanges();
    const group = fixture.debugElement.query(By.directive(CngxMenuGroup)).nativeElement as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Alignment');
    const radios = fixture.debugElement
      .queryAll(By.directive(CngxMenuItemRadio))
      .map((d) => d.nativeElement as HTMLElement);
    expect(radios).toHaveLength(3);
    radios.forEach((el) => {
      expect(el.getAttribute('role')).toBe('menuitemradio');
      expect(el.getAttribute('aria-checked')).toBe('false');
    });
  });

  it('click on one radio selects it and deselects others', () => {
    const fixture = TestBed.createComponent(RadioHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const radios = fixture.debugElement
      .queryAll(By.directive(CngxMenuItemRadio))
      .map((d) => d.nativeElement as HTMLElement);
    radios[1].click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(radios[2].getAttribute('aria-checked')).toBe('false');
    radios[2].click();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(radios[1].getAttribute('aria-checked')).toBe('false');
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
  });
});
