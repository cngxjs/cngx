import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { describe, expect, it } from 'vitest';

import { CngxCheckbox } from '../checkbox/checkbox.component';
import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxCheckboxGroup } from './checkbox-group.component';

const POOL: readonly string[] = ['a', 'b', 'c'];

@Component({
  template: `
    <cngx-checkbox-group
      label="Notifications"
      [(selectedValues)]="picked"
      [allValues]="pool"
      [disabled]="off()"
    />
  `,
  imports: [CngxCheckboxGroup],
})
class Host {
  readonly pool = POOL;
  picked = signal<string[]>([]);
  off = signal(false);
}

@Component({
  template: `
    <cngx-checkbox
      [value]="group.allSelected()"
      [indeterminate]="group.someSelected()"
      (valueChange)="group.toggleAll()"
    >Select all</cngx-checkbox>
    <cngx-checkbox-group
      #group="cngxCheckboxGroup"
      label="Pool"
      [(selectedValues)]="picked"
      [allValues]="pool"
    />
  `,
  imports: [CngxCheckbox, CngxCheckboxGroup],
})
class MasterHost {
  readonly pool = POOL;
  picked = signal<string[]>(['a']);
}

@Component({
  template: ` <cngx-checkbox-group label="Async" [state]="state" /> `,
  imports: [CngxCheckboxGroup],
})
class StateHost {
  readonly state: ManualAsyncState<string> = createManualState<string>();
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const groupDe = fixture.debugElement.query(By.directive(CngxCheckboxGroup));
  return {
    fixture,
    host: fixture.componentInstance,
    group: groupDe.injector.get(CngxCheckboxGroup),
    groupEl: groupDe.nativeElement as HTMLElement,
    groupDe,
  };
}

describe('CngxCheckboxGroup', () => {
  it('renders role="group" with the required aria-label', () => {
    const { groupEl } = setup();
    expect(groupEl.getAttribute('role')).toBe('group');
    expect(groupEl.getAttribute('aria-label')).toBe('Notifications');
  });

  it('provides CNGX_CONTROL_VALUE via useExisting', () => {
    const { group, groupDe } = setup();
    expect(groupDe.injector.get(CNGX_CONTROL_VALUE)).toBe(group);
  });

  it('selectedValues two-way binds with the consumer model', () => {
    const { fixture, group, host } = setup();
    group.select('a');
    fixture.detectChanges();
    expect(host.picked()).toEqual(['a']);
    host.picked.set(['a', 'b']);
    fixture.detectChanges();
    expect(group.selectedCount()).toBe(2);
  });

  it('allSelected/someSelected/noneSelected derive from membership against allValues', () => {
    const { fixture, group, host } = setup();
    expect(group.noneSelected()).toBe(true);
    expect(group.someSelected()).toBe(false);
    expect(group.allSelected()).toBe(false);

    host.picked.set(['a']);
    fixture.detectChanges();
    expect(group.noneSelected()).toBe(false);
    expect(group.someSelected()).toBe(true);
    expect(group.allSelected()).toBe(false);

    host.picked.set(['a', 'b', 'c']);
    fixture.detectChanges();
    expect(group.noneSelected()).toBe(false);
    expect(group.someSelected()).toBe(false);
    expect(group.allSelected()).toBe(true);
  });

  it('toggleAll picks all when partial; clears all when full (idempotent)', () => {
    const { fixture, group, host } = setup();
    group.toggleAll();
    fixture.detectChanges();
    expect(host.picked()).toEqual(['a', 'b', 'c']);
    group.toggleAll();
    fixture.detectChanges();
    expect(host.picked()).toEqual([]);
  });

  it('master checkbox bound to allSelected + someSelected reads aria-checked="mixed" when partial', () => {
    const fixture = TestBed.createComponent(MasterHost);
    fixture.detectChanges();
    const checkboxEl = fixture.debugElement.query(By.directive(CngxCheckbox))
      .nativeElement as HTMLElement;
    expect(checkboxEl.getAttribute('aria-checked')).toBe('mixed');

    fixture.componentInstance.picked.set(['a', 'b', 'c']);
    fixture.detectChanges();
    expect(checkboxEl.getAttribute('aria-checked')).toBe('true');

    fixture.componentInstance.picked.set([]);
    fixture.detectChanges();
    expect(checkboxEl.getAttribute('aria-checked')).toBe('false');
  });

  it('select / deselect are idempotent and respect disabled', () => {
    const { fixture, group, host } = setup();
    group.select('a');
    group.select('a');
    fixture.detectChanges();
    expect(host.picked()).toEqual(['a']);

    group.deselect('a');
    group.deselect('a');
    fixture.detectChanges();
    expect(host.picked()).toEqual([]);

    host.off.set(true);
    fixture.detectChanges();
    group.select('a');
    fixture.detectChanges();
    expect(host.picked()).toEqual([]);
  });

  it('disabled cascades aria-disabled on the host', () => {
    const { fixture, host, groupEl } = setup();
    expect(groupEl.getAttribute('aria-disabled')).toBeNull();
    host.off.set(true);
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-disabled')).toBe('true');
  });

  it('aria-busy reflects state.status() === "loading" reactively', () => {
    const fixture = TestBed.createComponent(StateHost);
    fixture.detectChanges();
    const groupEl = fixture.debugElement.query(By.directive(CngxCheckboxGroup))
      .nativeElement as HTMLElement;
    expect(groupEl.getAttribute('aria-busy')).toBeNull();

    fixture.componentInstance.state.set('loading');
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.state.setSuccess('ok');
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-busy')).toBeNull();
  });

  it('selected snapshot stays structurally equal across equal-array re-emissions', () => {
    const { fixture, group, host } = setup();
    host.picked.set(['a', 'b']);
    fixture.detectChanges();
    const first = group.selectedCount();
    host.picked.set(['a', 'b']);
    fixture.detectChanges();
    expect(group.selectedCount()).toBe(first);
  });
});
