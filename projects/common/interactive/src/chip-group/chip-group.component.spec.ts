import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxChip } from '@cngx/common/display';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { describe, expect, it } from 'vitest';

import { CngxChipInGroup } from '../chip-in-group/chip-in-group.directive';
import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CNGX_CHIP_GROUP_HOST } from './chip-group-host.token';
import { CngxChipGroup } from './chip-group.component';

@Component({
  template: `
    <cngx-chip-group
      label="Size"
      [(selected)]="picked"
      [disabled]="off()"
    >
      <cngx-chip cngxChipInGroup [value]="'sm'">Small</cngx-chip>
      <cngx-chip cngxChipInGroup [value]="'md'">Medium</cngx-chip>
      <cngx-chip cngxChipInGroup [value]="'lg'">Large</cngx-chip>
    </cngx-chip-group>
  `,
  imports: [CngxChip, CngxChipInGroup, CngxChipGroup],
})
class Host {
  picked = signal<string | undefined>(undefined);
  off = signal(false);
}

@Component({
  template: `<cngx-chip-group label="Async" [state]="state" />`,
  imports: [CngxChipGroup],
})
class StateHost {
  readonly state: ManualAsyncState<string> = createManualState<string>();
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const groupDe = fixture.debugElement.query(By.directive(CngxChipGroup));
  return {
    fixture,
    host: fixture.componentInstance,
    group: groupDe.injector.get(CngxChipGroup) as CngxChipGroup<string>,
    groupEl: groupDe.nativeElement as HTMLElement,
    groupDe,
    chipEls: fixture.debugElement
      .queryAll(By.directive(CngxChipInGroup))
      .map((d) => d.nativeElement as HTMLElement),
  };
}

describe('CngxChipGroup', () => {
  it('renders role="listbox" with the bound aria-label', () => {
    const { groupEl } = setup();
    expect(groupEl.getAttribute('role')).toBe('listbox');
    expect(groupEl.getAttribute('aria-label')).toBe('Size');
  });

  it('provides BOTH CNGX_CHIP_GROUP_HOST and CNGX_CONTROL_VALUE via useExisting', () => {
    const { group, groupDe } = setup();
    expect(groupDe.injector.get(CNGX_CHIP_GROUP_HOST)).toBe(group);
    expect(groupDe.injector.get(CNGX_CONTROL_VALUE)).toBe(group);
  });

  it('selected two-way binds with the consumer model', () => {
    const { fixture, host, chipEls } = setup();
    chipEls[1].click();
    fixture.detectChanges();
    expect(host.picked()).toBe('md');
    expect(chipEls[1].getAttribute('aria-selected')).toBe('true');
  });

  it('toggle clears selection when re-clicking the active chip (single-mode)', () => {
    const { fixture, host, chipEls } = setup();
    chipEls[0].click();
    fixture.detectChanges();
    expect(host.picked()).toBe('sm');
    chipEls[0].click();
    fixture.detectChanges();
    expect(host.picked()).toBeUndefined();
  });

  it('only one chip is aria-selected at a time (single-select semantics)', () => {
    const { fixture, chipEls } = setup();
    chipEls[0].click();
    fixture.detectChanges();
    expect(chipEls[0].getAttribute('aria-selected')).toBe('true');
    expect(chipEls[1].getAttribute('aria-selected')).toBe('false');
    chipEls[1].click();
    fixture.detectChanges();
    expect(chipEls[0].getAttribute('aria-selected')).toBe('false');
    expect(chipEls[1].getAttribute('aria-selected')).toBe('true');
  });

  it('isSelected/toggle/remove from CngxChipGroupHost contract are exposed', () => {
    const { group } = setup();
    expect(group.isSelected('sm')).toBe(false);
    group.toggle('sm');
    expect(group.isSelected('sm')).toBe(true);
    group.remove('sm');
    expect(group.isSelected('sm')).toBe(false);
  });

  it('disabled cascades aria-disabled and blocks toggle/remove from leaves', () => {
    const { fixture, host, groupEl, chipEls } = setup();
    expect(groupEl.getAttribute('aria-disabled')).toBeNull();
    host.off.set(true);
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-disabled')).toBe('true');
    chipEls[0].click();
    fixture.detectChanges();
    expect(host.picked()).toBeUndefined();
  });

  it('aria-busy reflects state.status() === "loading" reactively', () => {
    const fixture = TestBed.createComponent(StateHost);
    fixture.detectChanges();
    const groupEl = fixture.debugElement.query(By.directive(CngxChipGroup))
      .nativeElement as HTMLElement;
    expect(groupEl.getAttribute('aria-busy')).toBeNull();
    fixture.componentInstance.state.set('loading');
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-busy')).toBe('true');
    fixture.componentInstance.state.setSuccess('ok');
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-busy')).toBeNull();
  });

  it('aria-orientation defaults to horizontal class but does not emit attr', () => {
    const { groupEl } = setup();
    expect(groupEl.classList.contains('cngx-chip-group--horizontal')).toBe(true);
  });
});
