import {
  Component,
  Directive,
  model,
  signal,
  type ModelSignal,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { CNGX_CONTROL_VALUE, type CngxControlValue } from './control-value.token';

@Directive({
  selector: '[testControl]',
  standalone: true,
  providers: [{ provide: CNGX_CONTROL_VALUE, useExisting: TestControl }],
})
class TestControl implements CngxControlValue<string> {
  readonly value = model<string>('initial');
  readonly disabled = signal(false);
}

@Component({
  template: `<div testControl></div>`,
  imports: [TestControl],
})
class HostCmp {}

describe('CNGX_CONTROL_VALUE / CngxControlValue', () => {
  describe('type contract', () => {
    it('requires value to be a ModelSignal<T>', () => {
      expectTypeOf<CngxControlValue<string>['value']>().toEqualTypeOf<
        ModelSignal<string>
      >();
    });

    it('requires disabled to be a WritableSignal<boolean>', () => {
      expectTypeOf<CngxControlValue<string>['disabled']>().toEqualTypeOf<
        WritableSignal<boolean>
      >();
    });

    it('rejects a plain WritableSignal masquerading as ModelSignal for value', () => {
      expectTypeOf<WritableSignal<string>>().not.toMatchTypeOf<
        ModelSignal<string>
      >();
    });
  });

  describe('runtime conformance', () => {
    function resolveToken(): CngxControlValue<string> {
      const fixture = TestBed.createComponent(HostCmp);
      fixture.detectChanges();
      const host = fixture.debugElement.query(By.directive(TestControl));
      return host.injector.get(CNGX_CONTROL_VALUE) as CngxControlValue<string>;
    }

    it('resolves the directive instance via the token and exposes a writable value', () => {
      const ctrl = resolveToken();
      expect(ctrl.value()).toBe('initial');
      ctrl.value.set('next');
      expect(ctrl.value()).toBe('next');
    });

    it('exposes a writable disabled signal', () => {
      const ctrl = resolveToken();
      expect(ctrl.disabled()).toBe(false);
      ctrl.disabled.set(true);
      expect(ctrl.disabled()).toBe(true);
    });
  });
});
