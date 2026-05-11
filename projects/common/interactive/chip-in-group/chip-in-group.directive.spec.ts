import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxChip } from '@cngx/common/display';
import { describe, expect, it } from 'vitest';

import {
  CNGX_CHIP_GROUP_HOST,
  type CngxChipGroupHost,
} from '../chip-group/chip-group-host.token';
import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxChipInGroup } from './chip-in-group.directive';

@Directive({
  selector: '[fakeChipGroupHost]',
  exportAs: 'fakeChipGroupHost',
  standalone: true,
  providers: [
    { provide: CNGX_CHIP_GROUP_HOST, useExisting: FakeChipGroupHost },
  ],
})
class FakeChipGroupHost<T = string> implements CngxChipGroupHost<T> {
  readonly selectedValues = signal<readonly T[]>([]);
  readonly disabled = signal(false);

  readonly isDisabled = this.disabled.asReadonly();

  toggleCalls: T[] = [];
  removeCalls: T[] = [];

  isSelected(value: T): boolean {
    return this.selectedValues().some((v) => Object.is(v, value));
  }

  toggle(value: T): void {
    this.toggleCalls.push(value);
  }

  remove(value: T): void {
    this.removeCalls.push(value);
  }

  setSelected(value: T, selected: boolean): void {
    const cur = this.selectedValues();
    if (selected && !cur.some((v) => Object.is(v, value))) {
      this.selectedValues.set([...cur, value]);
    } else if (!selected) {
      this.selectedValues.set(cur.filter((v) => !Object.is(v, value)));
    }
  }
}

@Component({
  template: `
    <div fakeChipGroupHost #fake="fakeChipGroupHost">
      <cngx-chip cngxChipInGroup [value]="'x'" [disabled]="off()">x</cngx-chip>
    </div>
  `,
  imports: [FakeChipGroupHost, CngxChip, CngxChipInGroup],
})
class Host {
  off = signal(false);
}

@Component({
  template: `
    <div fakeChipGroupHost #fake="fakeChipGroupHost">
      <cngx-chip cngxChipInGroup [value]="'a'" [removable]="true">A</cngx-chip>
    </div>
  `,
  imports: [FakeChipGroupHost, CngxChip, CngxChipInGroup],
})
class RemovableHost {}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const fakeDe = fixture.debugElement.query(By.directive(FakeChipGroupHost));
  const chipDe = fixture.debugElement.query(By.directive(CngxChipInGroup));
  return {
    fixture,
    host: fixture.componentInstance,
    fake: fakeDe.injector.get(FakeChipGroupHost) as FakeChipGroupHost<string>,
    chipEl: chipDe.nativeElement as HTMLElement,
    chipDe,
  };
}

describe('CngxChipInGroup', () => {
  it('initialises with role=option, aria-selected=false', () => {
    const { chipEl } = setup();
    expect(chipEl.getAttribute('role')).toBe('option');
    expect(chipEl.getAttribute('aria-selected')).toBe('false');
  });

  it('selected mirrors parent.isSelected reactively (computed, not local model)', () => {
    const { fixture, fake, chipEl } = setup();
    expect(chipEl.getAttribute('aria-selected')).toBe('false');
    fake.setSelected('x', true);
    fixture.detectChanges();
    expect(chipEl.getAttribute('aria-selected')).toBe('true');
  });

  it('click and Space/Enter call parent.toggle(value)', () => {
    const { fake, chipEl } = setup();
    chipEl.click();
    chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(fake.toggleCalls).toEqual(['x', 'x', 'x']);
  });

  it('Backspace and Delete call parent.remove(value)', () => {
    const { fake, chipEl } = setup();
    chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }));
    chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', cancelable: true }));
    expect(fake.removeCalls).toEqual(['x', 'x']);
  });

  it('blocks toggle and remove when own disabled is true', () => {
    const { fixture, host, fake, chipEl } = setup();
    host.off.set(true);
    fixture.detectChanges();
    chipEl.click();
    chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(fake.toggleCalls).toEqual([]);
    expect(fake.removeCalls).toEqual([]);
    expect(chipEl.getAttribute('aria-disabled')).toBe('true');
  });

  it('blocks toggle and remove when group is disabled (cascade)', () => {
    const { fixture, fake, chipEl } = setup();
    fake.disabled.set(true);
    fixture.detectChanges();
    expect(chipEl.getAttribute('aria-disabled')).toBe('true');
    chipEl.click();
    expect(fake.toggleCalls).toEqual([]);
  });

  it('throws NullInjectorError when no parent CNGX_CHIP_GROUP_HOST is present', () => {
    @Component({
      template: `<cngx-chip cngxChipInGroup [value]="'a'">a</cngx-chip>`,
      imports: [CngxChip, CngxChipInGroup],
    })
    class Orphan {}
    expect(() => {
      const fixture = TestBed.createComponent(Orphan);
      fixture.detectChanges();
    }).toThrow(/CngxChipGroupHost/);
  });

  it('does NOT provide CNGX_CONTROL_VALUE (parent group is the field control)', () => {
    const { chipDe } = setup();
    expect(chipDe.injector.get(CNGX_CONTROL_VALUE, null)).toBeNull();
  });

  it('does NOT toggle when click originates inside the chip close button', () => {
    const fixture = TestBed.createComponent(RemovableHost);
    fixture.detectChanges();
    const fake = fixture.debugElement
      .query(By.directive(FakeChipGroupHost))
      .injector.get(FakeChipGroupHost) as FakeChipGroupHost<string>;
    const chipEl = fixture.debugElement.query(By.directive(CngxChipInGroup))
      .nativeElement as HTMLElement;
    const closeBtn = chipEl.querySelector('.cngx-chip__remove') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    closeBtn.click();
    expect(fake.toggleCalls).toEqual([]);
  });
});
