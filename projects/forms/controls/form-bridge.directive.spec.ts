import { Component, effect, ElementRef, Injector, signal, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import {
  CngxCheckbox,
  CngxCheckboxGroup,
  CngxMultiChipGroup,
  CngxRadioGroup,
  CngxToggle,
} from '@cngx/common/interactive';
import { CngxFormBridge } from './form-bridge.directive';

// ── Boolean atom (CngxToggle) ─────────────────────────────────────────

@Component({
  template: `<cngx-toggle [formControl]="ctrl" #host>label</cngx-toggle>`,
  imports: [CngxToggle, ReactiveFormsModule, CngxFormBridge],
})
class ToggleHost {
  readonly ctrl = new FormControl<boolean>(false, { nonNullable: true });
  @ViewChild('host', { read: CngxToggle }) toggle!: CngxToggle;
  @ViewChild('host', { read: ElementRef }) hostEl!: ElementRef<HTMLElement>;
  @ViewChild('host', { read: CngxFormBridge }) bridge!: CngxFormBridge<boolean>;
}

// ── Scalar atom (CngxRadioGroup) ──────────────────────────────────────

@Component({
  template: `
    <cngx-radio-group [formControl]="ctrl" #host>
      <span></span>
    </cngx-radio-group>
  `,
  imports: [CngxRadioGroup, ReactiveFormsModule, CngxFormBridge],
})
class RadioHost {
  readonly ctrl = new FormControl<string | null>(null);
  @ViewChild('host', { read: CngxRadioGroup }) group!: CngxRadioGroup<string>;
  @ViewChild('host', { read: ElementRef }) hostEl!: ElementRef<HTMLElement>;
  @ViewChild('host', { read: CngxFormBridge })
  bridge!: CngxFormBridge<string | null>;
}

// ── Array atom (CngxCheckboxGroup) ────────────────────────────────────

@Component({
  template: `<cngx-checkbox-group [formControl]="ctrl" #host></cngx-checkbox-group>`,
  imports: [CngxCheckboxGroup, ReactiveFormsModule, CngxFormBridge],
})
class CheckboxGroupHost {
  readonly ctrl = new FormControl<string[]>([], { nonNullable: true });
  @ViewChild('host', { read: CngxCheckboxGroup })
  group!: CngxCheckboxGroup<string>;
  @ViewChild('host', { read: CngxFormBridge })
  bridge!: CngxFormBridge<string[]>;
}

// ── Multi-chip-group (array of arbitrary T) ───────────────────────────

@Component({
  template: `<cngx-multi-chip-group [formControl]="ctrl" #host></cngx-multi-chip-group>`,
  imports: [CngxMultiChipGroup, ReactiveFormsModule, CngxFormBridge],
})
class MultiChipGroupHost {
  readonly ctrl = new FormControl<string[]>([], { nonNullable: true });
  @ViewChild('host', { read: CngxMultiChipGroup })
  group!: CngxMultiChipGroup<string>;
  @ViewChild('host', { read: CngxFormBridge })
  bridge!: CngxFormBridge<string[]>;
}

describe('CngxFormBridge', () => {
  // ── Provider registration ────────────────────────────────────────────

  it('registers itself as NG_VALUE_ACCESSOR via useExisting', () => {
    TestBed.configureTestingModule({ imports: [ToggleHost] });
    const fixture = TestBed.createComponent(ToggleHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const accessors = fixture.debugElement.children[0].injector.get(
      NG_VALUE_ACCESSOR,
    );
    expect(accessors).toBeDefined();
    const list = Array.isArray(accessors) ? accessors : [accessors];
    expect(list.some((a) => a instanceof CngxFormBridge)).toBe(true);
  });

  // ── Boolean shape ────────────────────────────────────────────────────

  describe('boolean shape (CngxToggle)', () => {
    function setup(): { fixture: ReturnType<typeof TestBed.createComponent<ToggleHost>>; host: ToggleHost } {
      TestBed.configureTestingModule({ imports: [ToggleHost] });
      const fixture = TestBed.createComponent(ToggleHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      return { fixture, host: fixture.componentInstance };
    }

    it('writeValue pushes the FormControl value into the atom model', () => {
      const { fixture, host } = setup();
      expect(host.toggle.value()).toBe(false);

      host.ctrl.setValue(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(host.toggle.value()).toBe(true);
    });

    it('user-driven model write feeds back into the FormControl', () => {
      const { fixture, host } = setup();

      host.toggle.value.set(true);
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(host.ctrl.value).toBe(true);
    });

    it('setDisabledState forwards into the atom disabled signal', () => {
      const { fixture, host } = setup();
      expect(host.toggle.disabled()).toBe(false);

      host.ctrl.disable();
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(host.toggle.disabled()).toBe(true);

      host.ctrl.enable();
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(host.toggle.disabled()).toBe(false);
    });

    it('focusout marks the FormControl as touched', () => {
      const { fixture, host } = setup();
      expect(host.ctrl.touched).toBe(false);

      host.hostEl.nativeElement.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true }),
      );
      fixture.detectChanges();

      expect(host.ctrl.touched).toBe(true);
    });
  });

  // ── Scalar shape ─────────────────────────────────────────────────────

  describe('scalar shape (CngxRadioGroup)', () => {
    it('focusout to a node inside the host leaves the FormControl untouched', () => {
      TestBed.configureTestingModule({ imports: [RadioHost] });
      const fixture = TestBed.createComponent(RadioHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const hostEl = fixture.componentInstance.hostEl.nativeElement;
      const inner = hostEl.querySelector('span')!;

      inner.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: hostEl }));
      fixture.detectChanges();
      expect(fixture.componentInstance.ctrl.touched).toBe(false);

      inner.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
      );
      fixture.detectChanges();
      expect(fixture.componentInstance.ctrl.touched).toBe(true);
    });

    it('round-trips the FormControl value as string|null', () => {
      TestBed.configureTestingModule({ imports: [RadioHost] });
      const fixture = TestBed.createComponent(RadioHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;

      // RF's initial writeValue(null) lands on the group's
      // value model - null overrides the model's undefined default.
      expect(host.group.value()).toBeNull();

      host.ctrl.setValue('cash');
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.group.value()).toBe('cash');

      host.group.value.set('card');
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(host.ctrl.value).toBe('card');
    });
  });

  // ── Array shape ──────────────────────────────────────────────────────

  describe('array shape (CngxCheckboxGroup)', () => {
    it('round-trips array values (CheckboxGroup)', () => {
      TestBed.configureTestingModule({ imports: [CheckboxGroupHost] });
      const fixture = TestBed.createComponent(CheckboxGroupHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;

      expect(host.group.selectedValues()).toEqual([]);

      host.ctrl.setValue(['a', 'b']);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.group.selectedValues()).toEqual(['a', 'b']);

      host.group.selectedValues.set(['a', 'b', 'c']);
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(host.ctrl.value).toEqual(['a', 'b', 'c']);
    });

    it('round-trips array values (MultiChipGroup)', () => {
      TestBed.configureTestingModule({ imports: [MultiChipGroupHost] });
      const fixture = TestBed.createComponent(MultiChipGroupHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;

      host.ctrl.setValue(['ng', 'rx']);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.group.selectedValues()).toEqual(['ng', 'rx']);

      host.group.selectedValues.set(['ng']);
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(host.ctrl.value).toEqual(['ng']);
    });
  });

  // ── Single-fire regression for registerOnChange ──────────────────────

  describe('single-fire regression on registerOnChange', () => {
    it('fires fn exactly once per user-driven mutation', () => {
      TestBed.configureTestingModule({ imports: [ToggleHost] });
      const fixture = TestBed.createComponent(ToggleHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;

      // Replace the FormControl-supplied onChange listener with an
      // instrumented spy. Mirrors the Phase-6a commit-5 cascade-witness
      // pattern (instrumented spy + baseline+delta assertion).
      const fn = vi.fn<(v: boolean) => void>();
      host.bridge.registerOnChange(fn);
      TestBed.flushEffects();
      const baseline = fn.mock.calls.length;
      expect(baseline).toBe(0); // initial-fire skip - value was already delivered via writeValue

      host.toggle.value.set(true);
      TestBed.flushEffects();
      expect(fn.mock.calls.length).toBe(baseline + 1);
      expect(fn).toHaveBeenLastCalledWith(true);

      host.toggle.value.set(false);
      TestBed.flushEffects();
      expect(fn.mock.calls.length).toBe(baseline + 2);
      expect(fn).toHaveBeenLastCalledWith(false);
    });

    it('forwards a model write to the control synchronously, before any effect flush', () => {
      TestBed.configureTestingModule({ imports: [ToggleHost] });
      const fixture = TestBed.createComponent(ToggleHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;

      host.toggle.value.set(true);

      expect(host.ctrl.value).toBe(true);
      expect(host.ctrl.dirty).toBe(true);
    });

    it('does NOT re-fire fn when writeValue lands a value (echo guard)', () => {
      TestBed.configureTestingModule({ imports: [ToggleHost] });
      const fixture = TestBed.createComponent(ToggleHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;

      const fn = vi.fn<(v: boolean) => void>();
      host.bridge.registerOnChange(fn);

      // RF -> view roundtrip (value identical to current).
      host.bridge.writeValue(false);
      expect(fn).not.toHaveBeenCalled();

      // RF -> view, fresh value: the model's synchronous echo stays out of onChange.
      host.bridge.writeValue(true);
      expect(fn).not.toHaveBeenCalled();

      // User-driven write - must fire.
      host.toggle.value.set(false);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenLastCalledWith(false);
    });

    it('keeps fn-internal signal reads out of an effect that writes the model (cascade canary)', () => {
      // An atom may write its model inside an effect (input-mask clears on a
      // mask change), and the model emits synchronously, so fn runs inside
      // that effect. The bridge relies on Angular's output emit calling
      // listeners with no active consumer; if that ever changes, fn's read of
      // externalProbe becomes a dependency and an externalProbe write re-runs the effect.
      TestBed.configureTestingModule({ imports: [ToggleHost] });
      const fixture = TestBed.createComponent(ToggleHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;

      const externalProbe = signal('a');
      const fn = vi.fn<(v: boolean) => void>().mockImplementation(() => {
        externalProbe();
      });
      host.bridge.registerOnChange(fn);

      const trigger = signal(false);
      let runs = 0;
      effect(
        () => {
          runs++;
          host.toggle.value.set(trigger());
        },
        { injector: TestBed.inject(Injector) },
      );
      TestBed.flushEffects();
      trigger.set(true);
      TestBed.flushEffects();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(runs).toBe(2);

      externalProbe.set('b');
      TestBed.flushEffects();
      expect(runs).toBe(2);
    });
  });

  // ── Parent [value] binding next to [formControl] ─────────────────────

  describe('parent [value] binding next to [formControl]', () => {
    @Component({
      template: `<cngx-checkbox [formControl]="ctrl" [(value)]="mirror" #host>label</cngx-checkbox>`,
      imports: [CngxCheckbox, ReactiveFormsModule, CngxFormBridge],
    })
    class MirrorHost {
      ctrl = new FormControl<boolean>(false, { nonNullable: true });
      readonly mirror = signal(false);
      @ViewChild('host', { read: ElementRef }) hostEl!: ElementRef<HTMLElement>;
    }

    function setup(ctrl?: FormControl<boolean>) {
      TestBed.configureTestingModule({ imports: [MirrorHost] });
      const fixture = TestBed.createComponent(MirrorHost);
      if (ctrl) {
        fixture.componentInstance.ctrl = ctrl;
      }
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;
      const setValue = vi.spyOn(host.ctrl, 'setValue');
      return { fixture, host, setValue };
    }

    it('a programmatic parent write leaves the control pristine and calls no setValue', () => {
      const { fixture, host, setValue } = setup();

      host.mirror.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(host.ctrl.value).toBe(false);
      expect(host.ctrl.dirty).toBe(false);
      expect(setValue).not.toHaveBeenCalled();
    });

    it('a click back to the control value after a parent write still dirties the control', () => {
      const { fixture, host, setValue } = setup();

      host.mirror.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      host.hostEl.nativeElement.click();
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(host.mirror()).toBe(false);
      expect(host.ctrl.value).toBe(false);
      expect(host.ctrl.dirty).toBe(true);
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    it('a click dirties the control with exactly one setValue', () => {
      const { fixture, host, setValue } = setup();

      host.hostEl.nativeElement.click();
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(host.ctrl.value).toBe(true);
      expect(host.ctrl.dirty).toBe(true);
      expect(setValue).toHaveBeenCalledTimes(1);
      expect(host.mirror()).toBe(true);
    });

    it('Space dirties the control with exactly one setValue', () => {
      const { fixture, host, setValue } = setup();

      host.hostEl.nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
      );
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(host.ctrl.value).toBe(true);
      expect(host.ctrl.dirty).toBe(true);
      expect(setValue).toHaveBeenCalledTimes(1);
    });

    it("updateOn: 'blur' holds the click until focus leaves", () => {
      const { fixture, host } = setup(new FormControl(false, { nonNullable: true, updateOn: 'blur' }));

      host.hostEl.nativeElement.click();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.ctrl.value).toBe(false);

      host.hostEl.nativeElement.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      expect(host.ctrl.value).toBe(true);
      expect(host.ctrl.dirty).toBe(true);
    });
  });

  // ── Selector coverage ────────────────────────────────────────────────

  describe('selector coverage', () => {
    it('attaches to formControlName inside a FormGroup', () => {
      @Component({
        template: `
          <div [formGroup]="form">
            <cngx-toggle formControlName="enabled" #host></cngx-toggle>
          </div>
        `,
        imports: [CngxToggle, ReactiveFormsModule, CngxFormBridge],
      })
      class GroupHost {
        readonly form = new FormGroup({
          enabled: new FormControl(false, { nonNullable: true }),
        });
        @ViewChild('host', { read: CngxFormBridge })
        bridge!: CngxFormBridge<boolean>;
        @ViewChild('host', { read: CngxToggle }) toggle!: CngxToggle;
      }

      TestBed.configureTestingModule({ imports: [GroupHost] });
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;

      expect(host.bridge).toBeDefined();

      host.form.patchValue({ enabled: true });
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.toggle.value()).toBe(true);
    });
  });
});
