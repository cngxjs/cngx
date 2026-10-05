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
import { describe, expect, it } from 'vitest';

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

// Compile-checked: the spec builder does not type-check `expectTypeOf`, so
// equality is a `true` assigned to a type that is `false` on a mismatch.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

describe('CNGX_CONTROL_VALUE / CngxControlValue', () => {
  describe('type contract', () => {
    it('requires value to be a ModelSignal<T>', () => {
      const isModel: Equal<CngxControlValue<string>['value'], ModelSignal<string>> = true;
      expect(isModel).toBe(true);
    });

    it('requires disabled to be a WritableSignal<boolean>', () => {
      const isWritable: Equal<CngxControlValue<string>['disabled'], WritableSignal<boolean>> = true;
      expect(isWritable).toBe(true);
    });

    it('rejects a plain WritableSignal masquerading as ModelSignal for value', () => {
      const plain = signal('initial');
      // @ts-expect-error -- a WritableSignal lacks the ModelSignal surface
      const asModel: ModelSignal<string> = plain;
      expect(asModel).toBe(plain);
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
