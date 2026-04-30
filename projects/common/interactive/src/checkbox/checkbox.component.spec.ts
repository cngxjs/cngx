import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxCheckboxIndicator } from '@cngx/common/display';
import { describe, expect, it } from 'vitest';

import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxCheckbox } from './checkbox.component';

@Component({
  template: `<cngx-checkbox [(value)]="v" [(indeterminate)]="ind" [disabled]="off()">L</cngx-checkbox>`,
  imports: [CngxCheckbox],
})
class Host {
  v = signal(false);
  ind = signal(false);
  off = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxCheckbox));
  return {
    fixture,
    host: fixture.componentInstance,
    dir: de.injector.get(CngxCheckbox),
    el: de.nativeElement as HTMLElement,
  };
}

describe('CngxCheckbox', () => {
  it('initialises with role=checkbox and aria-checked=false', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('checkbox');
    expect(el.getAttribute('aria-checked')).toBe('false');
  });

  it('flips value on click and propagates via two-way binding', () => {
    const { fixture, el, host } = setup();
    el.click();
    fixture.detectChanges();
    expect(host.v()).toBe(true);
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('reports aria-checked="mixed" when indeterminate', () => {
    const { fixture, el, host } = setup();
    host.ind.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-checked')).toBe('mixed');
  });

  it('clicking an indeterminate checkbox sets value=true AND indeterminate=false in one step', () => {
    const { fixture, el, host } = setup();
    host.ind.set(true);
    fixture.detectChanges();
    el.click();
    fixture.detectChanges();
    expect(host.v()).toBe(true);
    expect(host.ind()).toBe(false);
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('Space and Enter advance the same way as click', () => {
    const { fixture, el, host } = setup();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    fixture.detectChanges();
    expect(host.v()).toBe(true);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    fixture.detectChanges();
    expect(host.v()).toBe(false);
  });

  it('composes <cngx-checkbox-indicator> with checkbox variant + reactive checked/indeterminate inputs', () => {
    const { fixture, host } = setup();
    const indicator = fixture.debugElement
      .query(By.directive(CngxCheckboxIndicator))
      .componentInstance as CngxCheckboxIndicator;
    expect(indicator.variant()).toBe('checkbox');
    expect(indicator.checked()).toBe(false);
    expect(indicator.indeterminate()).toBe(false);

    host.v.set(true);
    fixture.detectChanges();
    expect(indicator.checked()).toBe(true);

    host.ind.set(true);
    fixture.detectChanges();
    expect(indicator.indeterminate()).toBe(true);
  });

  it('disabled blocks click and emits aria-disabled', () => {
    const { fixture, el, host } = setup();
    host.off.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-disabled')).toBe('true');
    el.click();
    fixture.detectChanges();
    expect(host.v()).toBe(false);
  });

  it('provides CNGX_CONTROL_VALUE useExisting', () => {
    const { dir, fixture } = setup();
    const de = fixture.debugElement.query(By.directive(CngxCheckbox));
    expect(de.injector.get(CNGX_CONTROL_VALUE)).toBe(dir);
  });
});
