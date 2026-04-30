import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxToggle } from './toggle.component';

@Component({
  template: `<cngx-toggle [(value)]="bound" [disabled]="off()" [disabledReason]="reason()">Lbl</cngx-toggle>`,
  imports: [CngxToggle],
})
class Host {
  bound = signal(false);
  off = signal(false);
  reason = signal('');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxToggle));
  return {
    fixture,
    host: fixture.componentInstance,
    dir: de.injector.get(CngxToggle),
    el: de.nativeElement as HTMLElement,
  };
}

describe('CngxToggle', () => {
  it('initialises with role=switch, tabindex=0, aria-checked=false', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('switch');
    expect(el.getAttribute('aria-checked')).toBe('false');
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('flips value and aria-checked on click via two-way binding', () => {
    const { fixture, el, host } = setup();
    el.click();
    fixture.detectChanges();
    expect(host.bound()).toBe(true);
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('flips value on Space and Enter, preventing default', () => {
    const { fixture, el } = setup();
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    el.dispatchEvent(space);
    fixture.detectChanges();
    expect(el.getAttribute('aria-checked')).toBe('true');
    expect(space.defaultPrevented).toBe(true);

    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    el.dispatchEvent(enter);
    fixture.detectChanges();
    expect(el.getAttribute('aria-checked')).toBe('false');
    expect(enter.defaultPrevented).toBe(true);
  });

  it('blocks click + keydown when disabled and reflects aria-disabled, tabindex=-1', () => {
    const { fixture, el, host } = setup();
    host.off.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('tabindex')).toBe('-1');
    el.click();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    fixture.detectChanges();
    expect(host.bound()).toBe(false);
  });

  it('wires aria-describedby only when disabledReason is non-empty', () => {
    const { fixture, el, host } = setup();
    expect(el.getAttribute('aria-describedby')).toBeNull();
    host.reason.set('Locked by your OS preference');
    fixture.detectChanges();
    const id = el.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    const span = el.querySelector(`#${id}`);
    expect(span?.textContent).toContain('Locked by your OS preference');
  });

  it('provides CNGX_CONTROL_VALUE useExisting (token resolves to the same instance)', () => {
    const { dir, fixture } = setup();
    const de = fixture.debugElement.query(By.directive(CngxToggle));
    expect(de.injector.get(CNGX_CONTROL_VALUE)).toBe(dir);
  });
});
