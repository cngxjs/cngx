import { Component, DestroyRef, inject, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CngxChip } from '@cngx/common/display';
import {
  CngxCheckbox,
  CngxChipInteraction,
  CngxMultiChipGroup,
  CngxToggle,
} from '@cngx/common/interactive';
import { adaptFormControl, CngxFormField } from '@cngx/forms/field';
import { CngxInputMask, CngxNumericInput } from '@cngx/forms/input';
import { CngxFormBridge } from './form-bridge.directive';

// CNGX2033: a parent value binding next to [formControl] updates the atom but
// never the control. The bridge warns once per instance in dev mode.

function settle(fixture: ComponentFixture<unknown>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
}

function mount<T>(type: Type<T>) {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  settle(fixture);
  const el = fixture.nativeElement as HTMLElement;
  const warnings = () =>
    warn.mock.calls
      .map((call: unknown[]) => String(call[0]))
      .filter((message) => message.startsWith('CNGX2033: '));
  return { fixture, host: fixture.componentInstance, el, warnings };
}

@Component({
  template: `<cngx-checkbox [formControl]="ctrl" [(value)]="mirror">Check</cngx-checkbox>`,
  imports: [CngxCheckbox, ReactiveFormsModule, CngxFormBridge],
})
class TwoWayHost {
  readonly ctrl = new FormControl(false, { nonNullable: true });
  readonly mirror = signal(false);
}

@Component({
  template: `<cngx-toggle [formControl]="ctrl" [value]="on()">Toggle</cngx-toggle>`,
  imports: [CngxToggle, ReactiveFormsModule, CngxFormBridge],
})
class OneWayHost {
  readonly ctrl = new FormControl(false, { nonNullable: true });
  readonly on = signal(false);
}

@Component({
  template: `
    <cngx-multi-chip-group [formControl]="ctrl" [selectedValues]="picked()" />
  `,
  imports: [CngxMultiChipGroup, ReactiveFormsModule, CngxFormBridge],
})
class GroupHost {
  readonly ctrl = new FormControl<string[]>([], { nonNullable: true });
  readonly picked = signal<string[]>([]);
}

@Component({
  template: `
    <cngx-chip cngxChipInteraction [value]="'a'" [formControl]="ctrl" [selected]="on()">
      Chip
    </cngx-chip>
  `,
  imports: [CngxChip, CngxChipInteraction, ReactiveFormsModule, CngxFormBridge],
})
class ChipHost {
  readonly ctrl = new FormControl(false, { nonNullable: true });
  readonly on = signal(false);
}

@Component({
  template: `<cngx-checkbox [formControl]="ctrl">Check</cngx-checkbox>`,
  imports: [CngxCheckbox, ReactiveFormsModule, CngxFormBridge],
})
class PlainHost {
  readonly ctrl = new FormControl(false, { nonNullable: true });
}

@Component({
  template: `
    <div [formGroup]="form">
      <cngx-toggle formControlName="enabled">Toggle</cngx-toggle>
    </div>
  `,
  imports: [CngxToggle, ReactiveFormsModule, CngxFormBridge],
})
class FormGroupHost {
  readonly form = new FormGroup({ enabled: new FormControl(false, { nonNullable: true }) });
}

@Component({
  template: `
    <input [cngxInputMask]="pattern()" [formControl]="mask" />
    <input cngxNumericInput [formControl]="amount" />
  `,
  imports: [CngxInputMask, CngxNumericInput, ReactiveFormsModule, CngxFormBridge],
})
class InputHost {
  readonly pattern = signal('00:00');
  readonly mask = new FormControl('1430', { nonNullable: true });
  readonly amount = new FormControl<number | null>(12);
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-checkbox [formControl]="ctrl">Check</cngx-checkbox>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxCheckbox, ReactiveFormsModule, CngxFormBridge],
})
class FieldHost {
  readonly ctrl = new FormControl(false, { nonNullable: true });
  readonly field = adaptFormControl(this.ctrl, 'check', inject(DestroyRef));
}

describe('CngxFormBridge - parent value binding warning (CNGX2033)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('warns once when a two-way [(value)] parent write diverges from the control', () => {
    const { fixture, host, el, warnings } = mount(TwoWayHost);
    expect(warnings()).toEqual([]);

    host.mirror.set(true);
    settle(fixture);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatch(
      /^CNGX2033: \[cngx-checkbox\] the value is bound by a parent \[value\] binding next to \[formControl\]/,
    );
    expect(host.ctrl.value).toBe(false);

    host.mirror.set(false);
    settle(fixture);
    el.querySelector<HTMLElement>('cngx-checkbox')!.click();
    settle(fixture);
    host.mirror.set(false);
    settle(fixture);
    expect(warnings()).toHaveLength(1);
  });

  it('warns for a one-way [value] binding', () => {
    const { fixture, host, warnings } = mount(OneWayHost);
    host.on.set(true);
    settle(fixture);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatch(/^CNGX2033: \[cngx-toggle\] /);
  });

  it('warns for [selectedValues] on a group and [selected] on cngxChipInteraction', () => {
    const group = mount(GroupHost);
    group.host.picked.set(['a']);
    settle(group.fixture);
    expect(group.warnings()).toHaveLength(1);
    expect(group.warnings()[0]).toMatch(/^CNGX2033: \[cngx-multi-chip-group\] /);

    vi.restoreAllMocks();
    const chip = mount(ChipHost);
    chip.host.on.set(true);
    settle(chip.fixture);
    expect(chip.warnings()).toHaveLength(1);
    expect(chip.warnings()[0]).toMatch(/^CNGX2033: \[cngx-chip\] /);
  });

  it('stays silent for a two-way binding that only mirrors the atom and the control', () => {
    const { fixture, host, el, warnings } = mount(TwoWayHost);
    const box = el.querySelector<HTMLElement>('cngx-checkbox')!;

    box.click();
    settle(fixture);
    box.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    settle(fixture);
    host.ctrl.setValue(true);
    settle(fixture);
    host.ctrl.reset(false);
    settle(fixture);

    expect(host.mirror()).toBe(false);
    expect(warnings()).toEqual([]);
  });

  it('stays silent for [formControl], formControlName and programmatic control writes', () => {
    const plain = mount(PlainHost);
    plain.el.querySelector<HTMLElement>('cngx-checkbox')!.click();
    settle(plain.fixture);
    plain.host.ctrl.setValue(false);
    plain.host.ctrl.reset(true);
    settle(plain.fixture);

    const group = mount(FormGroupHost);
    group.el.querySelector<HTMLElement>('cngx-toggle')!.click();
    settle(group.fixture);
    group.host.form.patchValue({ enabled: false });
    group.host.form.reset({ enabled: true });
    settle(group.fixture);

    expect(plain.warnings()).toEqual([]);
    expect(group.warnings()).toEqual([]);
  });

  it('stays silent for mask, numeric input typing and a mask pattern switch', () => {
    const { fixture, host, el, warnings } = mount(InputHost);
    const [mask, numeric] = Array.from(el.querySelectorAll('input'));

    mask.setSelectionRange(0, 0);
    mask.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: '0', cancelable: true }),
    );
    settle(fixture);
    numeric.value = '42';
    numeric.dispatchEvent(new Event('input', { bubbles: true }));
    settle(fixture);
    host.pattern.set('000-000');
    settle(fixture);
    host.mask.setValue('123456');
    host.amount.reset(null);
    settle(fixture);

    expect(warnings()).toEqual([]);
  });

  it('stays silent for a bridged atom inside cngx-form-field', () => {
    const { fixture, host, el, warnings } = mount(FieldHost);
    el.querySelector<HTMLElement>('cngx-checkbox')!.click();
    settle(fixture);
    host.ctrl.setValue(false);
    host.ctrl.reset(true);
    settle(fixture);

    expect(warnings()).toEqual([]);
  });

  it('stays silent without ngDevMode', () => {
    vi.stubGlobal('ngDevMode', false);
    const { fixture, host, warnings } = mount(TwoWayHost);

    host.mirror.set(true);
    settle(fixture);

    expect(warnings()).toEqual([]);
  });
});
