import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxRadioGroup } from './radio-group.component';
import { CNGX_RADIO_GROUP } from './radio-group.token';
import { CngxRadio } from './radio.component';

@Component({
  template: `
    <cngx-radio-group [(value)]="v" [disabled]="groupOff()">
      <cngx-radio value="a">A</cngx-radio>
      <cngx-radio value="b">B</cngx-radio>
      <cngx-radio value="c" [disabled]="cOff()">C</cngx-radio>
    </cngx-radio-group>
  `,
  imports: [CngxRadioGroup, CngxRadio],
})
class Host {
  v = signal<string | undefined>(undefined);
  groupOff = signal(false);
  cOff = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const groupDe = fixture.debugElement.query(By.directive(CngxRadioGroup));
  const radioDes = fixture.debugElement.queryAll(By.directive(CngxRadio));
  return {
    fixture,
    host: fixture.componentInstance,
    group: groupDe.injector.get(CngxRadioGroup),
    groupEl: groupDe.nativeElement as HTMLElement,
    radios: radioDes.map((de) => ({
      dir: de.injector.get(CngxRadio),
      el: de.nativeElement as HTMLElement,
    })),
  };
}

describe('CngxRadioGroup + CngxRadio', () => {
  it('group provides CNGX_RADIO_GROUP and CNGX_CONTROL_VALUE useExisting', () => {
    const { fixture, group } = setup();
    const groupDe = fixture.debugElement.query(By.directive(CngxRadioGroup));
    expect(groupDe.injector.get(CNGX_RADIO_GROUP)).toBe(group);
    expect(groupDe.injector.get(CNGX_CONTROL_VALUE)).toBe(group);
  });

  it('radios inject the group via the token (never the concrete class)', () => {
    const { group, fixture } = setup();
    const radioDe = fixture.debugElement.query(By.directive(CngxRadio));
    expect(radioDe.injector.get(CNGX_RADIO_GROUP)).toBe(group);
  });

  it('renders role="radiogroup" on the group and role="radio" on each leaf', () => {
    const { groupEl, radios } = setup();
    expect(groupEl.getAttribute('role')).toBe('radiogroup');
    radios.forEach(({ el }) => expect(el.getAttribute('role')).toBe('radio'));
  });

  it('clicking a radio sets the group value and reflects aria-checked', () => {
    const { fixture, host, radios } = setup();
    radios[1].el.click();
    fixture.detectChanges();
    expect(host.v()).toBe('b');
    expect(radios[0].el.getAttribute('aria-checked')).toBe('false');
    expect(radios[1].el.getAttribute('aria-checked')).toBe('true');
    expect(radios[2].el.getAttribute('aria-checked')).toBe('false');
  });

  it('Space and Enter on a radio select it', () => {
    const { fixture, host, radios } = setup();
    radios[0].el.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.v()).toBe('a');
    radios[1].el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.v()).toBe('b');
  });

  it('group.disabled cascades to radioDisabled and blocks selection', () => {
    const { fixture, host, radios } = setup();
    host.groupOff.set(true);
    fixture.detectChanges();
    radios.forEach(({ el }) =>
      expect(el.getAttribute('aria-disabled')).toBe('true'),
    );
    radios[0].el.click();
    fixture.detectChanges();
    expect(host.v()).toBeUndefined();
  });

  it('per-radio disabled blocks only that leaf, not its siblings', () => {
    const { fixture, host, radios } = setup();
    host.cOff.set(true);
    fixture.detectChanges();
    expect(radios[2].el.getAttribute('aria-disabled')).toBe('true');
    radios[2].el.click();
    fixture.detectChanges();
    expect(host.v()).toBeUndefined();
    radios[0].el.click();
    fixture.detectChanges();
    expect(host.v()).toBe('a');
  });

  it('arrow keydown raises pendingArrowSelect; focused leaf consumes it and selects', () => {
    const { fixture, host, group, groupEl, radios } = setup();
    groupEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(group.consumePendingArrowSelect('b')).toBe(true);
    fixture.detectChanges();
    expect(host.v()).toBe('b');
    expect(radios[1].el.getAttribute('aria-checked')).toBe('true');
  });

  it('Tab-into-group does NOT auto-select (no preceding arrow keydown)', () => {
    const { group, host } = setup();
    expect(group.consumePendingArrowSelect('a')).toBe(false);
    expect(host.v()).toBeUndefined();
  });

  it('consumePendingArrowSelect clears the flag so subsequent unrelated focus does not re-select', () => {
    const { groupEl, group } = setup();
    groupEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(group.consumePendingArrowSelect('a')).toBe(true);
    expect(group.consumePendingArrowSelect('b')).toBe(false);
  });

  it('group exposes a stable name (auto-generated) and propagates it to leaves', () => {
    const { group, radios } = setup();
    expect(group.name()).toMatch(/^cngx-radio-group/);
    radios.forEach(({ el }) => expect(el.getAttribute('name')).toBe(group.name()));
  });
});
