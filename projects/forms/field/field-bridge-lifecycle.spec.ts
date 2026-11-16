import { Component, DestroyRef, inject, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { disabled, form, schema } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import {
  CngxListbox,
  CngxOption,
  CngxRangeSlider,
  CngxRangeSliderTrack,
  CngxSlider,
  CngxSliderTrack,
} from '@cngx/common/interactive';

import { CngxBindField } from './bind-field.directive';
import { fieldControlFor } from './field-control-registry';
import { adaptFormControl } from './form-control-adapter';
import { CngxFormField } from './form-field.component';
import { CngxListboxFieldBridge } from './listbox-field-bridge.directive';
import { CngxRangeSliderFieldBridge } from './range-slider-field-bridge.directive';
import { CngxSliderFieldBridge } from './slider-field-bridge.directive';

// Disabled round trip and destroy path of every bridge and the adapter, driven
// through a real Signal Forms `form()` (or a real `FormControl`). A bridge has
// to follow the field both ways, and once its control is gone it must neither
// stay registered for the summary nor keep writing into the detached atom.

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

function mount<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  flush(fixture);
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

function fieldHost(el: HTMLElement): HTMLElement {
  return el.querySelector<HTMLElement>('cngx-form-field')!;
}

describe('field bridge lifecycle - listbox', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.color">
        @if (show()) {
          <div cngxListbox cngxListboxFieldBridge [label]="'Color'" tabindex="0">
            <div cngxOption value="red">Red</div>
            <div cngxOption value="blue">Blue</div>
          </div>
        }
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxListbox, CngxListboxFieldBridge, CngxOption],
  })
  class ListboxHost {
    readonly show = signal(true);
    readonly locked = signal(false);
    readonly f = form(
      signal({ color: 'red' }),
      schema<{ color: string }>((p) => {
        disabled(p.color, () => this.locked());
      }),
    );
  }

  it('disables the listbox with the field and enables it again', () => {
    const { fixture, host, el } = mount(ListboxHost);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxListbox);
    expect(listbox.disabled()).toBe(false);

    host.locked.set(true);
    flush(fixture);
    expect(listbox.disabled()).toBe(true);
    expect(fieldHost(el).classList).toContain('cngx-field--disabled');

    host.locked.set(false);
    flush(fixture);
    expect(listbox.disabled()).toBe(false);
    expect(fieldHost(el).classList).not.toContain('cngx-field--disabled');
  });

  it('releases the control and stops writing into the listbox once it is destroyed', () => {
    const { fixture, host } = mount(ListboxHost);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxListbox);
    expect(fieldControlFor(host.f.color())).toBeDefined();

    host.show.set(false);
    flush(fixture);
    expect(fieldControlFor(host.f.color())).toBeUndefined();

    host.f.color().value.set('blue');
    host.locked.set(true);
    expect(() => flush(fixture)).not.toThrow();
    expect(listbox.value()).toBe('red');
    expect(listbox.disabled()).toBe(false);
  });
});

describe('field bridge lifecycle - slider', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.volume">
        @if (show()) {
          <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" aria-label="Volume" />
        }
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxSlider, CngxSliderFieldBridge],
  })
  class SliderHost {
    readonly show = signal(true);
    readonly locked = signal(false);
    readonly f = form(
      signal({ volume: 40 }),
      schema<{ volume: number }>((p) => {
        disabled(p.volume, () => this.locked());
      }),
    );
  }

  function track(fixture: {
    debugElement: ReturnType<typeof TestBed.createComponent>['debugElement'];
  }) {
    return fixture.debugElement.query(By.directive(CngxSlider)).injector.get(CngxSliderTrack);
  }

  it('disables the slider with the field and enables it again', () => {
    const { fixture, host, el } = mount(SliderHost);
    const slider = track(fixture);
    expect(slider.disabled()).toBe(false);

    host.locked.set(true);
    flush(fixture);
    expect(slider.disabled()).toBe(true);
    expect(fieldHost(el).classList).toContain('cngx-field--disabled');

    host.locked.set(false);
    flush(fixture);
    expect(slider.disabled()).toBe(false);
    expect(fieldHost(el).classList).not.toContain('cngx-field--disabled');
  });

  it('releases the control and stops writing into the slider once it is destroyed', () => {
    const { fixture, host } = mount(SliderHost);
    const slider = track(fixture);
    expect(fieldControlFor(host.f.volume())).toBeDefined();

    host.show.set(false);
    flush(fixture);
    expect(fieldControlFor(host.f.volume())).toBeUndefined();

    host.f.volume().value.set(75);
    host.locked.set(true);
    expect(() => flush(fixture)).not.toThrow();
    expect(slider.value()).toBe(40);
    expect(slider.disabled()).toBe(false);
  });
});

describe('field bridge lifecycle - range slider', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.price">
        @if (show()) {
          <cngx-range-slider cngxRangeSliderFieldBridge [min]="0" [max]="1000" aria-label="Price" />
        }
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxRangeSlider, CngxRangeSliderFieldBridge],
  })
  class RangeHost {
    readonly show = signal(true);
    readonly locked = signal(false);
    readonly f = form(
      signal<{ price: [number, number] }>({ price: [100, 900] }),
      schema<{ price: [number, number] }>((p) => {
        disabled(p.price, () => this.locked());
      }),
    );
  }

  function track(fixture: {
    debugElement: ReturnType<typeof TestBed.createComponent>['debugElement'];
  }) {
    return fixture.debugElement
      .query(By.directive(CngxRangeSlider))
      .injector.get(CngxRangeSliderTrack);
  }

  it('disables the range slider with the field and enables it again', () => {
    const { fixture, host, el } = mount(RangeHost);
    const range = track(fixture);
    expect(range.disabled()).toBe(false);

    host.locked.set(true);
    flush(fixture);
    expect(range.disabled()).toBe(true);
    expect(fieldHost(el).classList).toContain('cngx-field--disabled');

    host.locked.set(false);
    flush(fixture);
    expect(range.disabled()).toBe(false);
    expect(fieldHost(el).classList).not.toContain('cngx-field--disabled');
  });

  it('releases the control and stops writing into the range slider once it is destroyed', () => {
    const { fixture, host } = mount(RangeHost);
    const range = track(fixture);
    expect(fieldControlFor(host.f.price())).toBeDefined();

    host.show.set(false);
    flush(fixture);
    expect(fieldControlFor(host.f.price())).toBeUndefined();

    host.f.price().value.set([300, 600]);
    host.locked.set(true);
    expect(() => flush(fixture)).not.toThrow();
    expect(range.value()).toEqual([100, 900]);
    expect(range.disabled()).toBe(false);
  });
});

describe('field bridge lifecycle - cngxBindField', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.code">
        @if (show()) {
          <input cngxBindField />
        }
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxBindField],
  })
  class BindHost {
    readonly show = signal(true);
    readonly locked = signal(false);
    readonly f = form(
      signal({ code: '' }),
      schema<{ code: string }>((p) => {
        disabled(p.code, () => this.locked());
      }),
    );
  }

  it('reports the field disabled and enabled again', () => {
    const { fixture, host, el } = mount(BindHost);
    const bridge = fixture.debugElement
      .query(By.directive(CngxBindField))
      .injector.get(CngxBindField);
    expect(bridge.disabled()).toBe(false);

    host.locked.set(true);
    flush(fixture);
    expect(bridge.disabled()).toBe(true);
    expect(fieldHost(el).classList).toContain('cngx-field--disabled');

    host.locked.set(false);
    flush(fixture);
    expect(bridge.disabled()).toBe(false);
    expect(fieldHost(el).classList).not.toContain('cngx-field--disabled');
  });

  it('releases the control once it is destroyed', () => {
    const { fixture, host } = mount(BindHost);
    expect(fieldControlFor(host.f.code())).toBeDefined();

    host.show.set(false);
    flush(fixture);
    expect(fieldControlFor(host.f.code())).toBeUndefined();

    host.f.code().value.set('x');
    host.locked.set(true);
    expect(() => flush(fixture)).not.toThrow();
  });
});

describe('field bridge lifecycle - adaptFormControl', () => {
  @Component({
    template: `
      <cngx-form-field [field]="field">
        <div cngxListbox cngxListboxFieldBridge [label]="'Color'" tabindex="0">
          <div cngxOption value="red">Red</div>
        </div>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxListbox, CngxListboxFieldBridge, CngxOption],
  })
  class AdaptedHost {
    readonly control = new FormControl('red');
    readonly field = adaptFormControl(this.control, 'color', inject(DestroyRef));
  }

  it('follows control.disable() and control.enable()', () => {
    const { fixture, host, el } = mount(AdaptedHost);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxListbox);
    expect(host.field().disabled()).toBe(false);

    host.control.disable();
    flush(fixture);
    expect(host.field().disabled()).toBe(true);
    expect(listbox.disabled()).toBe(true);
    expect(fieldHost(el).classList).toContain('cngx-field--disabled');

    host.control.enable();
    flush(fixture);
    expect(host.field().disabled()).toBe(false);
    expect(listbox.disabled()).toBe(false);
    expect(fieldHost(el).classList).not.toContain('cngx-field--disabled');
  });

  it('stops mirroring the control once its DestroyRef is destroyed', () => {
    const { fixture, host } = mount(AdaptedHost);
    const field = host.field;
    const control = host.control;
    fixture.destroy();

    expect(() => {
      control.setValue('blue');
      control.markAsTouched();
      control.disable();
    }).not.toThrow();
    expect(field().value()).toBe('red');
    expect(field().touched()).toBe(false);
    expect(field().disabled()).toBe(false);
  });
});
