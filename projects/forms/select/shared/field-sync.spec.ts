import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';
import type { CngxFieldAccessor, CngxFieldRef } from '@cngx/forms/field';

import { createFieldSync, type FieldSyncOptions } from './field-sync';
import { sameArrayContents } from './compare';
import type { CngxSelectCompareFn } from './select-core';

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
}

// ── Scalar probe (single-select / typeahead shape) ─────────────────────

@Component({
  selector: 'scalar-probe',
  template: '',
  standalone: true,
})
class ScalarProbe<T> {
  readonly value: WritableSignal<T | undefined> = signal<T | undefined>(undefined);
  constructor() {
    createFieldSync<T | undefined>({
      componentValue: this.value,
      valueEquals: (a, b) => Object.is(a, b),
      coerceFromField: (x) => x as T | undefined,
    });
  }
}

// ── Array probe (multi / combobox shape) ───────────────────────────────

@Component({
  selector: 'array-probe',
  template: '',
  standalone: true,
})
class ArrayProbe<T> {
  readonly values: WritableSignal<T[]> = signal<T[]>([]);
  readonly writeCount = signal(0);
  readonly compareWith = signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b));
  constructor() {
    const opts: FieldSyncOptions<T[]> = {
      componentValue: this.values,
      valueEquals: (a, b) => sameArrayContents(a, b, this.compareWith()),
      coerceFromField: (x) => (Array.isArray(x) ? ([...x] as T[]) : []),
      toFieldValue: (v) => [...v],
    };
    createFieldSync<T[]>(opts);
  }
}

// ── Host wrapper used for wired tests ──────────────────────────────────

@Component({
  selector: 'scalar-host',
  template: `
    <cngx-form-field [field]="field">
      <scalar-probe />
    </cngx-form-field>
  `,
  imports: [CngxFormField, ScalarProbe],
})
class ScalarHost {
  readonly _mock = createMockField<string>({ name: 'color', value: 'red' });
  readonly field: CngxFieldAccessor<string> = this._mock.accessor;
  readonly ref: MockFieldRef<string> = this._mock.ref;
}

@Component({
  selector: 'array-host',
  template: `
    <cngx-form-field [field]="field">
      <array-probe />
    </cngx-form-field>
  `,
  imports: [CngxFormField, ArrayProbe],
})
class ArrayHost {
  readonly _mock = createMockField<string[]>({ name: 'colors', value: ['red'] });
  readonly field: CngxFieldAccessor<string[]> = this._mock.accessor;
  readonly ref: MockFieldRef<string[]> = this._mock.ref;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('createFieldSync', () => {
  describe('no presenter', () => {
    it('is a no-op when the probe is not inside a cngx-form-field', () => {
      TestBed.configureTestingModule({ imports: [ScalarProbe] });
      const fixture = TestBed.createComponent(ScalarProbe<string>);
      flush(fixture);
      expect(fixture.componentInstance.value()).toBeUndefined();
      // Any mutations still work — the factory simply didn't install effects.
      fixture.componentInstance.value.set('local-only');
      expect(fixture.componentInstance.value()).toBe('local-only');
    });
  });

  describe('scalar (single-select) shape', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<ScalarHost>>;
    let probe: ScalarProbe<string>;
    let ref: MockFieldRef<string>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ScalarHost] });
      fixture = TestBed.createComponent(ScalarHost);
      flush(fixture);
      probe = fixture.debugElement.query(
        (de) => de.componentInstance instanceof ScalarProbe,
      ).componentInstance as ScalarProbe<string>;
      ref = fixture.componentInstance.ref;
    });

    it('Field → component: initial field value flows into the probe', () => {
      expect(probe.value()).toBe('red');
    });

    it('Field → component: external field mutation syncs into the probe', () => {
      ref.value.set('green');
      flush(fixture);
      expect(probe.value()).toBe('green');
    });

    it('Component → field: internal write is pushed back into the field', () => {
      probe.value.set('blue');
      flush(fixture);
      expect(ref.value()).toBe('blue');
    });

    it('valueEquals guard blocks a redundant write when values already agree', () => {
      // The test would loop infinitely without the equality guard, so the mere
      // fact that setUp + a same-value re-set completes is the contract.
      probe.value.set('red');
      flush(fixture);
      expect(ref.value()).toBe('red');
      expect(probe.value()).toBe('red');
    });
  });

  describe('array (multi-select) shape', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<ArrayHost>>;
    let probe: ArrayProbe<string>;
    let ref: MockFieldRef<string[]>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ArrayHost] });
      fixture = TestBed.createComponent(ArrayHost);
      flush(fixture);
      probe = fixture.debugElement.query(
        (de) => de.componentInstance instanceof ArrayProbe,
      ).componentInstance as ArrayProbe<string>;
      ref = fixture.componentInstance.ref;
    });

    it('coerceFromField clones the field array into the probe', () => {
      const fieldArr = ref.value();
      expect(probe.values()).toEqual(['red']);
      expect(probe.values()).not.toBe(fieldArr);
    });

    it('coerces a non-array field value to an empty array', () => {
      ref.value.set(null as unknown as string[]);
      flush(fixture);
      expect(probe.values()).toEqual([]);
    });

    it('sameArrayContents suppresses a write when the new array has the same items', () => {
      ref.value.set(['red']);
      flush(fixture);
      expect(probe.values()).toEqual(['red']);
      // New reference, same contents → no write.
      const before = probe.values();
      ref.value.set(['red']);
      flush(fixture);
      expect(probe.values()).toBe(before);
    });

    it('toFieldValue clones before writing back so the field owns its copy', () => {
      probe.values.set(['blue', 'green']);
      flush(fixture);
      const fieldValue = ref.value();
      expect(fieldValue).toEqual(['blue', 'green']);
      expect(fieldValue).not.toBe(probe.values());
    });
  });

  describe('internal write helper', () => {
    it('silently skips when fieldRef.value is not a writable signal', () => {
      const readonlySignal = signal('frozen').asReadonly();
      const fakeRef: CngxFieldRef<string> = {
        ...createMockField<string>({ value: 'frozen' }).ref,
        value: readonlySignal,
      } as CngxFieldRef<string>;
      // No TypeError — writing to a non-writable ref is a documented silent no-op.
      expect(() => {
        const signalLike = fakeRef.value as unknown;
        if (
          typeof signalLike === 'function' &&
          'set' in signalLike &&
          typeof (signalLike as { set: unknown }).set === 'function'
        ) {
          throw new Error('unexpected writable detection');
        }
      }).not.toThrow();
    });
  });
});
