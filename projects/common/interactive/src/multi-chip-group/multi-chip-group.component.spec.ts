import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxChip } from '@cngx/common/display';
import { describe, expect, it, vi } from 'vitest';

import { CngxChipInGroup } from '../chip-in-group/chip-in-group.directive';
import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CNGX_CHIP_GROUP_HOST } from '../chip-group/chip-group-host.token';
import { CngxMultiChipGroup } from './multi-chip-group.component';

@Component({
  template: `
    <cngx-multi-chip-group
      label="Tags"
      [(selectedValues)]="picked"
      [disabled]="off()"
    >
      <cngx-chip cngxChipInGroup [value]="'a'">A</cngx-chip>
      <cngx-chip cngxChipInGroup [value]="'b'">B</cngx-chip>
      <cngx-chip cngxChipInGroup [value]="'c'">C</cngx-chip>
    </cngx-multi-chip-group>
  `,
  imports: [CngxChip, CngxChipInGroup, CngxMultiChipGroup],
})
class Host {
  picked = signal<string[]>([]);
  off = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const groupDe = fixture.debugElement.query(By.directive(CngxMultiChipGroup));
  return {
    fixture,
    host: fixture.componentInstance,
    group: groupDe.injector.get(CngxMultiChipGroup) as CngxMultiChipGroup<string>,
    groupEl: groupDe.nativeElement as HTMLElement,
    groupDe,
    chipEls: fixture.debugElement
      .queryAll(By.directive(CngxChipInGroup))
      .map((d) => d.nativeElement as HTMLElement),
  };
}

describe('CngxMultiChipGroup', () => {
  it('renders role="listbox" with aria-multiselectable="true"', () => {
    const { groupEl } = setup();
    expect(groupEl.getAttribute('role')).toBe('listbox');
    expect(groupEl.getAttribute('aria-multiselectable')).toBe('true');
    expect(groupEl.getAttribute('aria-label')).toBe('Tags');
  });

  it('provides BOTH CNGX_CHIP_GROUP_HOST and CNGX_CONTROL_VALUE via useExisting', () => {
    const { group, groupDe } = setup();
    expect(groupDe.injector.get(CNGX_CHIP_GROUP_HOST)).toBe(group);
    expect(groupDe.injector.get(CNGX_CONTROL_VALUE)).toBe(group);
  });

  it('selectedValues two-way binds; multi-select adds and removes independently', () => {
    const { fixture, host, chipEls } = setup();
    chipEls[0].click();
    chipEls[2].click();
    fixture.detectChanges();
    expect(host.picked()).toEqual(['a', 'c']);
    expect(chipEls[0].getAttribute('aria-selected')).toBe('true');
    expect(chipEls[1].getAttribute('aria-selected')).toBe('false');
    expect(chipEls[2].getAttribute('aria-selected')).toBe('true');
  });

  it('selectedCount derives from controller and stays in sync', () => {
    const { fixture, group, host } = setup();
    expect(group.selectedCount()).toBe(0);
    host.picked.set(['a', 'b']);
    fixture.detectChanges();
    expect(group.selectedCount()).toBe(2);
  });

  it('CngxChipGroupHost.toggle/remove from the contract round-trip through the controller', () => {
    const { fixture, group, host } = setup();
    group.toggle('a');
    group.toggle('b');
    fixture.detectChanges();
    expect(host.picked()).toEqual(['a', 'b']);
    group.remove('a');
    fixture.detectChanges();
    expect(host.picked()).toEqual(['b']);
  });

  it('disabled cascades aria-disabled and blocks toggle/remove from leaves', () => {
    const { fixture, host, groupEl, chipEls } = setup();
    host.off.set(true);
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-disabled')).toBe('true');
    chipEls[0].click();
    fixture.detectChanges();
    expect(host.picked()).toEqual([]);
  });

  it('cascade-witness: selectedCount stable across structurally-equal selectedValues re-emissions', () => {
    const { fixture, group, host } = setup();
    host.picked.set(['a', 'b']);
    fixture.detectChanges();
    const witness = vi.fn(() => group.selectedCount());
    const probe = computed(witness);
    probe();
    const baseline = witness.mock.calls.length;
    // Fresh-but-equal array: same length + same per-entry references
    host.picked.set(['a', 'b']);
    fixture.detectChanges();
    probe();
    // The controller's structural-equal selected guard prevents
    // selectedCount from re-emitting; the computed read does NOT
    // re-trigger the witness.
    expect(witness.mock.calls.length).toBe(baseline);
  });

  it('keyFn enables stable membership across re-emissions of object-valued items', () => {
    interface Tag {
      readonly id: number;
      readonly label: string;
    }

    @Component({
      template: `
        <cngx-multi-chip-group
          label="Object Tags"
          [keyFn]="byId"
          [(selectedValues)]="picked"
        >
          <cngx-chip cngxChipInGroup [value]="alice()">Alice</cngx-chip>
        </cngx-multi-chip-group>
      `,
      imports: [CngxChip, CngxChipInGroup, CngxMultiChipGroup],
    })
    class ObjHost {
      readonly byId = (t: Tag): number => t.id;
      alice = signal<Tag>({ id: 1, label: 'Alice' });
      picked = signal<Tag[]>([]);
    }

    const fixture = TestBed.createComponent(ObjHost);
    fixture.detectChanges();
    const group = fixture.debugElement
      .query(By.directive(CngxMultiChipGroup))
      .injector.get(CngxMultiChipGroup) as CngxMultiChipGroup<Tag>;
    const initial = fixture.componentInstance.alice();
    group.toggle(initial);
    fixture.detectChanges();
    expect(group.selectedCount()).toBe(1);
    // Refetch with fresh reference, same id; membership must hold.
    fixture.componentInstance.alice.set({ id: 1, label: 'Alice' });
    fixture.componentInstance.picked.set([{ id: 1, label: 'Alice' }]);
    fixture.detectChanges();
    expect(group.selectedCount()).toBe(1);
  });
});
