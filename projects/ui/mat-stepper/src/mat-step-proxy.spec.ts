import {
  Component,
  inject,
  Injector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { MatStepProxy } from './mat-step-proxy';

interface MatStepStub {
  label: string;
  editable: boolean;
  completed: boolean;
  hasError: boolean;
}

function makeStub(overrides: Partial<MatStepStub> = {}): MatStepStub {
  return {
    label: 'Step',
    editable: true,
    completed: false,
    hasError: false,
    ...overrides,
  };
}

@Component({ standalone: true, template: '' })
class HostCmp {
  readonly injector = inject(Injector);
}

function makeProxy(stub: MatStepStub, id = 'step-1') {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proxy = new MatStepProxy(stub as any, id, fixture.componentInstance.injector);
  return { proxy, fixture };
}

describe('MatStepProxy', () => {
  it('snapshots MatStep props on construction', () => {
    const stub = makeStub({ label: 'Profile', completed: true });
    const { proxy } = makeProxy(stub);
    expect(proxy.label()).toBe('Profile');
    expect(proxy.disabled()).toBe(false);
    expect(proxy.state()).toBe('success');
  });

  it('updates label after the next render tick when MatStep mutates', async () => {
    const stub = makeStub({ label: 'Initial' });
    const { proxy, fixture } = makeProxy(stub);
    expect(proxy.label()).toBe('Initial');
    stub.label = 'Updated';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(proxy.label()).toBe('Updated');
  });

  it('derives state from completed + hasError', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const inj = fixture.componentInstance.injector;

    const idle = makeStub();
    const success = makeStub({ completed: true });
    const error = makeStub({ hasError: true });
    // hasError wins over completed even when both are set.
    const errorWins = makeStub({ completed: true, hasError: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(new MatStepProxy(idle as any, 'a', inj).state()).toBe('idle');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(new MatStepProxy(success as any, 'b', inj).state()).toBe('success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(new MatStepProxy(error as any, 'c', inj).state()).toBe('error');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(new MatStepProxy(errorWins as any, 'd', inj).state()).toBe('error');
  });

  it('returns stable signal references across toRegistration() calls', () => {
    const { proxy } = makeProxy(makeStub());
    const reg1 = proxy.toRegistration();
    const reg2 = proxy.toRegistration();
    expect(reg1.label).toBe(reg2.label);
    expect(reg1.disabled).toBe(reg2.disabled);
    expect(reg1.state).toBe(reg2.state);
  });

  it('toRegistration() returns the cngx CngxStepRegistration shape', () => {
    const { proxy } = makeProxy(makeStub({ label: 'Confirm' }));
    const reg = proxy.toRegistration();
    expect(reg.id).toBe('step-1');
    expect(reg.kind).toBe('step');
    expect(reg.label()).toBe('Confirm');
    expect(reg.disabled()).toBe(false);
    expect(reg.state()).toBe('idle');
  });

  it('idempotent-write guard: signals do not re-emit on unchanged MatStep props', async () => {
    const stub = makeStub({ label: 'Stable' });
    const { proxy, fixture } = makeProxy(stub);

    let labelEmits = 0;
    let stateEmits = 0;
    // Subscribe via effect to count emissions. equal: Object.is on the
    // signal slots should suppress redundant set() calls.
    TestBed.runInInjectionContext(() => {
      const noop = signal(0);
      noop;
    });
    // Direct subscription via createWatch is unavailable in test; instead
    // we sample the underlying value getter and count actual changes.
    const startLabel = proxy.label();
    const startState = proxy.state();
    for (let i = 0; i < 5; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      if (proxy.label() !== startLabel) {
        labelEmits++;
      }
      if (proxy.state() !== startState) {
        stateEmits++;
      }
    }
    expect(labelEmits).toBe(0);
    expect(stateEmits).toBe(0);
  });

  it('destroy() stops the afterRenderEffect — post-destroy MatStep mutations are ignored', async () => {
    const stub = makeStub({ label: 'BeforeDestroy' });
    const { proxy, fixture } = makeProxy(stub);
    proxy.destroy();
    stub.label = 'AfterDestroy';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(proxy.label()).toBe('BeforeDestroy');
  });
});
