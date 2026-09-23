import { Component, computed, effect, inject, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_ERROR_SCOPE, type CngxErrorScopeContract } from '@cngx/common/interactive';
import {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFieldSkin,
  type CngxFormFieldControl,
} from '@cngx/core/tokens';
import { CngxFormField } from './form-field.component';
import { CngxFormFieldPresenter } from './form-field-presenter';
import {
  CNGX_FORM_FIELD_CONFIG,
  DEFAULT_HINT_FORMATTERS,
  type ErrorStrategyContext,
  type ErrorStrategyFn,
} from './form-field.token';
import { createMockField, mockValidationError, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

function makeScopeStub(showErrors: Signal<boolean>): CngxErrorScopeContract {
  return {
    showErrors,
    reveal: () => {
      /* noop - tests drive the underlying writable signal directly */
    },
    reset: () => {
      /* noop */
    },
  };
}

@Component({
  template: `<cngx-form-field [field]="field()"></cngx-form-field>`,
  imports: [CngxFormField],
})
class TestHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

@Component({
  template: `<cngx-form-field [field]="field()" [skin]="skin()"></cngx-form-field>`,
  imports: [CngxFormField],
})
class SkinHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
  skin = signal<CngxFieldSkin | undefined>(undefined);
}

@Component({
  selector: 'stub-control',
  template: '',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: StubControl }],
})
class StubControl implements CngxFormFieldControl {
  readonly id = signal('stub-control-id');
  readonly focused = signal(false);
  readonly empty = signal(true);
  readonly disabled = signal(false);
  readonly errorState = signal(false);
}

@Component({
  selector: 'outer-composite',
  template: '<ng-content />',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: OuterComposite }],
})
class OuterComposite implements CngxFormFieldControl {
  readonly id = signal('outer-composite-id');
  readonly focused = signal(false);
  readonly empty = signal(false);
  readonly disabled = signal(false);
  readonly errorState = signal(false);
}

// Mirrors the createFieldControlAria / CNGX_FORM_FIELD_HOST identity every
// in-repo control uses: errorState resolves to the field's own showError.
@Component({
  selector: 'mirror-control',
  template: '',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: MirrorControl }],
})
class MirrorControl implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter);
  readonly id = computed(() => this.presenter.inputId());
  readonly focused = signal(false).asReadonly();
  readonly empty = signal(true).asReadonly();
  readonly disabled = computed(() => this.presenter.disabled());
  readonly errorState = computed(() => this.presenter.showError());
}

@Component({
  template: `<cngx-form-field [field]="field()"><stub-control /></cngx-form-field>`,
  imports: [CngxFormField, StubControl],
})
class DiscoveryHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <outer-composite><stub-control /></outer-composite>
    </cngx-form-field>
  `,
  imports: [CngxFormField, OuterComposite, StubControl],
})
class NestedProviderHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

@Component({
  template: `<cngx-form-field [field]="field()"><mirror-control /></cngx-form-field>`,
  imports: [CngxFormField, MirrorControl],
})
class MirrorHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

describe('CngxFormFieldPresenter', () => {
  let ref: MockFieldRef;
  let presenter: CngxFormFieldPresenter;
  let fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
  let host: TestHost;

  function setup(opts: Parameters<typeof createMockField>[0] = {}) {
    const mock = createMockField({ name: 'email', ...opts });
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    host.field.set(mock.accessor);
    fixture.detectChanges();
    TestBed.flushEffects();
    presenter = fixture.debugElement
      .query(By.directive(CngxFormFieldPresenter))
      .injector.get(CngxFormFieldPresenter);
    ref = mock.ref;
    return { mock, presenter, ref };
  }

  // ── ID Registry ──────────────────────────────────────────────────

  describe('ID registry', () => {
    beforeEach(() => setup());

    it('generates inputId from field name', () => {
      expect(presenter.inputId()).toBe('cngx-email-input');
    });

    it('generates labelId from field name', () => {
      expect(presenter.labelId()).toBe('cngx-email-label');
    });

    it('generates hintId from field name', () => {
      expect(presenter.hintId()).toBe('cngx-email-hint');
    });

    it('generates errorId from field name', () => {
      expect(presenter.errorId()).toBe('cngx-email-error');
    });

    it('describedBy contains only the hint ID while no error is shown', () => {
      expect(presenter.describedBy()).toBe('cngx-email-hint');
    });

    it('describedBy references the error ID only while showError is true', () => {
      ref.invalid.set(true);
      ref.touched.set(true);
      TestBed.flushEffects();
      expect(presenter.describedBy()).toBe('cngx-email-hint cngx-email-error');

      ref.invalid.set(false);
      TestBed.flushEffects();
      expect(presenter.describedBy()).toBe('cngx-email-hint');
    });

    it('updates IDs when field name changes', () => {
      ref.name.set('username');
      TestBed.flushEffects();
      expect(presenter.inputId()).toBe('cngx-username-input');
      expect(presenter.labelId()).toBe('cngx-username-label');
      expect(presenter.hintId()).toBe('cngx-username-hint');
      expect(presenter.errorId()).toBe('cngx-username-error');
      expect(presenter.describedBy()).toBe('cngx-username-hint');
    });
  });

  // ── State derivations ────────────────────────────────────────────

  describe('state derivations', () => {
    beforeEach(() => setup());

    it('reads required from field state', () => {
      expect(presenter.required()).toBe(false);
      ref.required.set(true);
      TestBed.flushEffects();
      expect(presenter.required()).toBe(true);
    });

    it('reads disabled from field state', () => {
      expect(presenter.disabled()).toBe(false);
      ref.disabled.set(true);
      TestBed.flushEffects();
      expect(presenter.disabled()).toBe(true);
    });

    it('reads pending from field state', () => {
      expect(presenter.pending()).toBe(false);
      ref.pending.set(true);
      TestBed.flushEffects();
      expect(presenter.pending()).toBe(true);
    });

    it('reads touched from field state', () => {
      expect(presenter.touched()).toBe(false);
      ref.touched.set(true);
      TestBed.flushEffects();
      expect(presenter.touched()).toBe(true);
    });

    it('reads dirty from field state', () => {
      expect(presenter.dirty()).toBe(false);
      ref.dirty.set(true);
      TestBed.flushEffects();
      expect(presenter.dirty()).toBe(true);
    });

    it('reads invalid from field state', () => {
      expect(presenter.invalid()).toBe(false);
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.invalid()).toBe(true);
    });

    it('reads valid from field state', () => {
      expect(presenter.valid()).toBe(true);
      ref.valid.set(false);
      TestBed.flushEffects();
      expect(presenter.valid()).toBe(false);
    });

    it('reads hidden from field state', () => {
      expect(presenter.hidden()).toBe(false);
      ref.hidden.set(true);
      TestBed.flushEffects();
      expect(presenter.hidden()).toBe(true);
    });

    it('reads readonly from field state', () => {
      expect(presenter.readonly()).toBe(false);
      ref.readonly.set(true);
      TestBed.flushEffects();
      expect(presenter.readonly()).toBe(true);
    });

    it('reads submitting from field state', () => {
      expect(presenter.submitting()).toBe(false);
      ref.submitting.set(true);
      TestBed.flushEffects();
      expect(presenter.submitting()).toBe(true);
    });

    it('reads errors from field state', () => {
      expect(presenter.errors()).toEqual([]);
      const err = mockValidationError('required', 'Required');
      ref.errors.set([err]);
      TestBed.flushEffects();
      expect(presenter.errors()).toEqual([err]);
    });

    it('reads disabledReasons from field state', () => {
      expect(presenter.disabledReasons()).toEqual([]);
      ref.disabledReasons.set([{ message: 'Fill password first' }]);
      TestBed.flushEffects();
      expect(presenter.disabledReasons()).toEqual([{ message: 'Fill password first' }]);
    });
  });

  // ── showError gate ───────────────────────────────────────────────

  describe('showError', () => {
    beforeEach(() => setup());

    it('is false when untouched and valid', () => {
      expect(presenter.showError()).toBe(false);
    });

    it('is false when touched but valid', () => {
      ref.touched.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);
    });

    it('is false when invalid but untouched', () => {
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);
    });

    it('is true when touched AND invalid', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(true);
    });

    it('becomes false when field becomes valid again', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(true);

      ref.invalid.set(false);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);
    });
  });

  // ── CngxErrorScope integration via CNGX_FORM_FIELD_REVEAL ────────

  describe('reveal-trigger integration', () => {
    function setupWithReveal(
      showErrors: Signal<boolean>,
      config?: { errorStrategy?: ErrorStrategyFn },
    ): { presenter: CngxFormFieldPresenter; ref: MockFieldRef } {
      const mock = createMockField({ name: 'email' });
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [
          { provide: CNGX_ERROR_SCOPE, useValue: makeScopeStub(showErrors) },
          { provide: CNGX_FORM_FIELD_CONFIG, useValue: config ?? {} },
        ],
      });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement
        .query(By.directive(CngxFormFieldPresenter))
        .injector.get(CngxFormFieldPresenter);
      return { presenter, ref: mock.ref };
    }

    it('widens showError to (touched OR reveal.showErrors) when reveal trigger is provided', () => {
      const showErrors = signal(false);
      const { presenter, ref } = setupWithReveal(showErrors.asReadonly());

      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);

      showErrors.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(true);

      showErrors.set(false);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);

      ref.touched.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(true);
    });

    it('reveal.showErrors does not surface errors while invalid is false', () => {
      const showErrors = signal(true);
      const { presenter } = setupWithReveal(showErrors.asReadonly());
      expect(presenter.showError()).toBe(false);
    });
  });

  // ── withErrorStrategy gating ─────────────────────────────────────

  describe('withErrorStrategy integration', () => {
    function setupWithStrategy(
      strategy: ErrorStrategyFn,
      revealShowErrors?: Signal<boolean>,
    ): { presenter: CngxFormFieldPresenter; ref: MockFieldRef } {
      const mock = createMockField({ name: 'email' });
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [
          { provide: CNGX_FORM_FIELD_CONFIG, useValue: { errorStrategy: strategy } },
          ...(revealShowErrors
            ? [{ provide: CNGX_ERROR_SCOPE, useValue: makeScopeStub(revealShowErrors) }]
            : []),
        ],
      });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement
        .query(By.directive(CngxFormFieldPresenter))
        .injector.get(CngxFormFieldPresenter);
      return { presenter, ref: mock.ref };
    }

    it('onSubmit strategy gates only on reveal.showErrors', () => {
      const showErrors = signal(false);
      const onSubmit: ErrorStrategyFn = (c) => c.submitted;
      const { presenter, ref } = setupWithStrategy(onSubmit, showErrors.asReadonly());

      ref.invalid.set(true);
      ref.touched.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);

      showErrors.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(true);
    });

    it('strategy receives the live snapshot (touched, dirty, submitted, invalid)', () => {
      const showErrors = signal(true);
      const seen: ErrorStrategyContext[] = [];
      const recordingStrategy: ErrorStrategyFn = (c) => {
        seen.push({ ...c });
        return c.touched && c.submitted;
      };

      const { presenter, ref } = setupWithStrategy(recordingStrategy, showErrors.asReadonly());
      ref.invalid.set(true);
      ref.touched.set(true);
      ref.dirty.set(true);
      TestBed.flushEffects();
      void presenter.showError();

      const last = seen.at(-1);
      expect(last).toEqual({
        touched: true,
        dirty: true,
        submitted: true,
        invalid: true,
      });
    });

    it('strategy short-circuits when invalid is false (early-exit before strategy call)', () => {
      const calls = vi.fn<ErrorStrategyFn>(() => true);
      const { presenter, ref } = setupWithStrategy(calls);
      void presenter.showError();
      expect(calls).not.toHaveBeenCalled();

      ref.invalid.set(true);
      TestBed.flushEffects();
      void presenter.showError();
      expect(calls).toHaveBeenCalled();
    });
  });

  // ── untracked() cascade-witness ──────────────────────────────────
  //
  // The presenter widens showError to track (invalid, touched, dirty,
  // reveal.showErrors). The strategy callback runs inside untracked() so
  // strategy-internal signal reads do not widen the dependency graph
  // beyond the four tracked sources - flat dependency graphs per
  // reference_signal_architecture §3.
  //
  // Mechanic: instrument an effect with vi.fn(() => presenter.showError());
  // mutate reveal.showErrors through 5 toggles while invalid stays true and
  // touched / dirty stay constant; assert the witness fires baseline + 5.
  // The strategy is wired to read a hidden signal - if the untracked() wrap
  // were removed, that hidden signal would also become tracked and any
  // mutation to it (none in this test) would cascade unrelated effects.
  // The assertion asserts the FORWARD path: reveal toggles propagate cleanly,
  // one cascade per genuine reveal change.

  describe('cascade-witness - untracked() wrap on strategy callback', () => {
    it('reveal toggles produce exactly one downstream re-fire each', () => {
      const showErrors = signal(false);
      const hiddenStrategySignal = signal(0);
      const strategy: ErrorStrategyFn = (c) => {
        // Strategy reads a hidden signal; the untracked() wrap on the
        // strategy call ensures this read does NOT widen showError's
        // dependency graph. The four declared inputs (touched, dirty,
        // submitted, invalid) are passed by value via the snapshot.
        void hiddenStrategySignal();
        return c.submitted || c.touched;
      };

      const mock = createMockField({ name: 'email' });
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [
          { provide: CNGX_FORM_FIELD_CONFIG, useValue: { errorStrategy: strategy } },
          { provide: CNGX_ERROR_SCOPE, useValue: makeScopeStub(showErrors.asReadonly()) },
        ],
      });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement
        .query(By.directive(CngxFormFieldPresenter))
        .injector.get(CngxFormFieldPresenter);
      ref = mock.ref;

      ref.invalid.set(true);
      TestBed.flushEffects();

      const witness = vi.fn(() => presenter.showError());
      TestBed.runInInjectionContext(() => {
        effect(() => {
          witness();
        });
      });
      TestBed.flushEffects();
      const baseline = witness.mock.calls.length;
      expect(baseline).toBeGreaterThanOrEqual(1);

      for (let i = 0; i < 5; i++) {
        showErrors.set(i % 2 === 0);
        TestBed.flushEffects();
      }

      expect(witness.mock.calls.length).toBe(baseline + 5);

      // Mutating the strategy-internal hidden signal does NOT cascade
      // - it lives behind the untracked() wrap on the strategy call.
      hiddenStrategySignal.set(42);
      TestBed.flushEffects();
      expect(witness.mock.calls.length).toBe(baseline + 5);
    });
  });

  // ── Constraint metadata ──────────────────────────────────────────

  describe('constraint metadata', () => {
    it('reads minLength', () => {
      setup({ minLength: 8 });
      expect(presenter.minLength()).toBe(8);
    });

    it('reads maxLength', () => {
      setup({ maxLength: 64 });
      expect(presenter.maxLength()).toBe(64);
    });

    it('reads min', () => {
      setup({ min: 0 });
      expect(presenter.min()).toBe(0);
    });

    it('reads max', () => {
      setup({ max: 100 });
      expect(presenter.max()).toBe(100);
    });

    it('minLength/maxLength are undefined when not set', () => {
      setup();
      expect(presenter.minLength()).toBeUndefined();
      expect(presenter.maxLength()).toBeUndefined();
    });
  });

  // ── constraintHints ──────────────────────────────────────────────

  describe('constraintHints', () => {
    it('returns empty when constraintHints feature is not enabled', () => {
      setup({ minLength: 8, maxLength: 64 });
      expect(presenter.constraintHints()).toEqual([]);
    });

    it('returns length range when both min and max length set', () => {
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [
          {
            provide: CNGX_FORM_FIELD_CONFIG,
            useValue: { constraintHints: DEFAULT_HINT_FORMATTERS },
          },
        ],
      });
      const mock = createMockField({ name: 'pw', minLength: 8, maxLength: 64 });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement
        .query(By.directive(CngxFormFieldPresenter))
        .injector.get(CngxFormFieldPresenter);

      expect(presenter.constraintHints()).toEqual(['8–64 characters']);
    });

    it('returns min-only hint', () => {
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [
          {
            provide: CNGX_FORM_FIELD_CONFIG,
            useValue: { constraintHints: DEFAULT_HINT_FORMATTERS },
          },
        ],
      });
      const mock = createMockField({ name: 'pw', minLength: 8 });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement
        .query(By.directive(CngxFormFieldPresenter))
        .injector.get(CngxFormFieldPresenter);

      expect(presenter.constraintHints()).toEqual(['Min. 8 characters']);
    });

    it('returns max-only hint', () => {
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [
          {
            provide: CNGX_FORM_FIELD_CONFIG,
            useValue: { constraintHints: DEFAULT_HINT_FORMATTERS },
          },
        ],
      });
      const mock = createMockField({ name: 'pw', maxLength: 64 });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement
        .query(By.directive(CngxFormFieldPresenter))
        .injector.get(CngxFormFieldPresenter);

      expect(presenter.constraintHints()).toEqual(['Max. 64 characters']);
    });

    it('returns numeric range hints for min/max', () => {
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [
          {
            provide: CNGX_FORM_FIELD_CONFIG,
            useValue: { constraintHints: DEFAULT_HINT_FORMATTERS },
          },
        ],
      });
      const mock = createMockField({ name: 'age', min: 18, max: 99 });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement
        .query(By.directive(CngxFormFieldPresenter))
        .injector.get(CngxFormFieldPresenter);

      expect(presenter.constraintHints()).toEqual(['18–99']);
    });
  });

  // ── Field switching ──────────────────────────────────────────────

  describe('field switching', () => {
    it('reacts when the field accessor is replaced', () => {
      setup({ name: 'email' });
      expect(presenter.name()).toBe('email');

      const mock2 = createMockField({ name: 'username', required: true });
      host.field.set(mock2.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(presenter.name()).toBe('username');
      expect(presenter.inputId()).toBe('cngx-username-input');
      expect(presenter.required()).toBe(true);
    });
  });

  // ── Control discovery (CNGX_FORM_FIELD_CONTROL) ──────────────────

  describe('control discovery', () => {
    let stub: StubControl;
    let fieldEl: HTMLElement;
    let discoveryFixture: ReturnType<typeof TestBed.createComponent<DiscoveryHost>>;

    function setupDiscovery(opts: Parameters<typeof createMockField>[0] = {}) {
      const mock = createMockField({ name: 'email', ...opts });
      TestBed.configureTestingModule({ imports: [DiscoveryHost] });
      discoveryFixture = TestBed.createComponent(DiscoveryHost);
      discoveryFixture.componentInstance.field.set(mock.accessor);
      discoveryFixture.detectChanges();
      TestBed.flushEffects();
      const fieldDebug = discoveryFixture.debugElement.query(By.directive(CngxFormField));
      fieldEl = fieldDebug.nativeElement;
      presenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      stub = discoveryFixture.debugElement.query(By.directive(StubControl)).componentInstance;
      ref = mock.ref;
    }

    function flush() {
      TestBed.flushEffects();
      discoveryFixture.detectChanges();
    }

    it('resolves the projected control through the token', () => {
      setupDiscovery();
      expect(presenter.control()).toBe(stub);
    });

    it('resolves controlId to the control-reported id', () => {
      setupDiscovery();
      expect(presenter.controlId()).toBe('stub-control-id');
    });

    it('falls back to inputId when the control reports an empty id', () => {
      setupDiscovery();
      stub.id.set('');
      flush();
      expect(presenter.controlId()).toBe('cngx-email-input');
    });

    it('toggles cngx-field--focused with the control focused signal', () => {
      setupDiscovery();
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(false);

      stub.focused.set(true);
      flush();
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(true);

      stub.focused.set(false);
      flush();
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(false);
    });

    it('toggles cngx-field--empty with the control empty signal', () => {
      setupDiscovery();
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(true);

      stub.empty.set(false);
      flush();
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(false);
    });

    it('widens cngx-field--disabled to field OR control', () => {
      setupDiscovery();
      expect(fieldEl.classList.contains('cngx-field--disabled')).toBe(false);

      stub.disabled.set(true);
      flush();
      expect(fieldEl.classList.contains('cngx-field--disabled')).toBe(true);
      expect(presenter.fieldOrControlDisabled()).toBe(true);
      expect(presenter.disabled()).toBe(false);

      stub.disabled.set(false);
      ref.disabled.set(true);
      flush();
      expect(fieldEl.classList.contains('cngx-field--disabled')).toBe(true);
    });

    it('widens cngx-field--error on control error state while showError stays field-driven', () => {
      setupDiscovery();
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(false);

      stub.errorState.set(true);
      flush();
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(true);
      expect(presenter.fieldOrControlError()).toBe(true);
      expect(presenter.showError()).toBe(false);

      stub.errorState.set(false);
      flush();
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(false);
    });

    it('reports no control and falls back for a field without providers', () => {
      const mock = createMockField({ name: 'email' });
      TestBed.configureTestingModule({ imports: [TestHost] });
      const bare = TestBed.createComponent(TestHost);
      bare.componentInstance.field.set(mock.accessor);
      bare.detectChanges();
      TestBed.flushEffects();
      const fieldDebug = bare.debugElement.query(By.directive(CngxFormField));
      const barePresenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      const bareEl: HTMLElement = fieldDebug.nativeElement;

      expect(barePresenter.control()).toBeUndefined();
      expect(barePresenter.controlId()).toBe('cngx-email-input');
      expect(bareEl.classList.contains('cngx-field--focused')).toBe(false);
      expect(bareEl.classList.contains('cngx-field--empty')).toBe(false);
    });

    it('prefers the first provider in content order (outer composite wins)', () => {
      const mock = createMockField({ name: 'email' });
      TestBed.configureTestingModule({ imports: [NestedProviderHost] });
      const nested = TestBed.createComponent(NestedProviderHost);
      nested.componentInstance.field.set(mock.accessor);
      nested.detectChanges();
      TestBed.flushEffects();
      const fieldDebug = nested.debugElement.query(By.directive(CngxFormField));
      const nestedPresenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      const outer = nested.debugElement.query(By.directive(OuterComposite)).componentInstance;

      expect(nestedPresenter.control()).toBe(outer);
      expect(nestedPresenter.controlId()).toBe('outer-composite-id');
    });

    it('stays cycle-free when the control mirrors showError as its errorState', () => {
      const mock = createMockField({ name: 'email' });
      TestBed.configureTestingModule({ imports: [MirrorHost] });
      const mirror = TestBed.createComponent(MirrorHost);
      mirror.componentInstance.field.set(mock.accessor);
      mirror.detectChanges();
      TestBed.flushEffects();
      const fieldDebug = mirror.debugElement.query(By.directive(CngxFormField));
      const mirrorPresenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      const mirrorEl: HTMLElement = fieldDebug.nativeElement;

      mock.ref.invalid.set(true);
      mock.ref.touched.set(true);
      TestBed.flushEffects();
      mirror.detectChanges();
      expect(mirrorPresenter.showError()).toBe(true);
      expect(mirrorPresenter.controlErrorState()).toBe(true);
      expect(mirrorEl.classList.contains('cngx-field--error')).toBe(true);

      mock.ref.invalid.set(false);
      TestBed.flushEffects();
      mirror.detectChanges();
      expect(mirrorPresenter.showError()).toBe(false);
      expect(mirrorPresenter.controlErrorState()).toBe(false);
      expect(mirrorEl.classList.contains('cngx-field--error')).toBe(false);
    });
  });

  describe('skin slot on the host contract', () => {
    it('publishes the bound skin unresolved', () => {
      const fixture = TestBed.createComponent(SkinHost);
      fixture.componentInstance.skin.set('fill');
      fixture.detectChanges();
      const host = fixture.debugElement
        .query(By.directive(CngxFormField))
        .injector.get(CNGX_FORM_FIELD_HOST);
      expect(host.skin?.()).toBe('fill');
    });

    it('reads undefined when no skin is bound', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      const host = fixture.debugElement
        .query(By.directive(CngxFormField))
        .injector.get(CNGX_FORM_FIELD_HOST);
      expect(host.skin?.()).toBeUndefined();
    });
  });
});
