import { Component, signal, type Signal, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createManualState } from '@cngx/common/data';
import { CNGX_FORM_FIELD_HOST } from '@cngx/core/tokens';
import { CNGX_STATEFUL, type CngxAsyncState } from '@cngx/core/utils';
import { describe, expect, it, vi } from 'vitest';

import {
  CNGX_ERROR_AGGREGATOR,
  type CngxErrorAggregatorContract,
} from '../error-aggregator/error-aggregator.token';
import { injectInteractiveGroupHost } from './group-host';

const aggregatorShouldShow = signal(false);
const aggregatorStub = {
  hasError: aggregatorShouldShow.asReadonly(),
  errorCount: signal(0).asReadonly(),
  activeErrors: signal<readonly string[]>([]).asReadonly(),
  errorLabels: signal<readonly string[]>([]).asReadonly(),
  shouldShow: aggregatorShouldShow.asReadonly(),
  announcement: signal('').asReadonly(),
  addSource: () => {},
  removeSource: () => {},
} satisfies CngxErrorAggregatorContract;

function makeFieldHost(showError: Signal<boolean>, labelId?: Signal<string>) {
  return { showError, markAsTouched: vi.fn(), labelId };
}

function setupHost(opts?: {
  providers?: Provider[];
  invalid?: Signal<boolean>;
  state?: Signal<CngxAsyncState<unknown> | undefined>;
  label?: Signal<string | undefined>;
  labelledBy?: Signal<string | undefined>;
}) {
  TestBed.configureTestingModule({ providers: opts?.providers ?? [] });
  return TestBed.runInInjectionContext(() =>
    injectInteractiveGroupHost({
      uidPrefix: 'cngx-probe-',
      invalid: opts?.invalid ?? signal(false),
      state: opts?.state,
      label: opts?.label,
      labelledBy: opts?.labelledBy,
    }),
  );
}

@Component({
  selector: 'cngx-group-host-probe',
  standalone: true,
  template: '',
})
class Probe {
  readonly invalid = signal(false);
  readonly groupHost = injectInteractiveGroupHost({
    uidPrefix: 'cngx-probe-',
    invalid: this.invalid,
  });
}

@Component({
  standalone: true,
  imports: [Probe],
  providers: [{ provide: CNGX_ERROR_AGGREGATOR, useValue: aggregatorStub }],
  template: '<cngx-group-host-probe />',
})
class AggregatorParent {}

@Component({
  selector: 'cngx-self-aggregator-probe',
  standalone: true,
  providers: [{ provide: CNGX_ERROR_AGGREGATOR, useValue: aggregatorStub }],
  template: '',
})
class SelfAggregatorProbe {
  readonly groupHost = injectInteractiveGroupHost({
    uidPrefix: 'cngx-probe-',
    invalid: signal(false),
  });
}

describe('injectInteractiveGroupHost', () => {
  it('prefixes the stable host id with the configured uidPrefix', () => {
    const host = setupHost();
    expect(host.id()).toMatch(/^cngx-probe-/);
  });

  it('tracks focus via the handler pair', () => {
    const host = setupHost();
    expect(host.focused()).toBe(false);
    host.handleFocusIn();
    expect(host.focused()).toBe(true);
    host.handleFocusOut();
    expect(host.focused()).toBe(false);
  });

  it('marks the surrounding field as touched on focusout', () => {
    const fieldHost = makeFieldHost(signal(false));
    const host = setupHost({
      providers: [{ provide: CNGX_FORM_FIELD_HOST, useValue: fieldHost }],
    });
    host.handleFocusOut();
    expect(fieldHost.markAsTouched).toHaveBeenCalledTimes(1);
  });

  it('errorState stays false standalone', () => {
    const host = setupHost();
    expect(host.errorState()).toBe(false);
  });

  it('errorState follows the field host, and a false field host short-circuits the cascade', () => {
    const showError = signal(false);
    const host = setupHost({
      providers: [{ provide: CNGX_FORM_FIELD_HOST, useValue: makeFieldHost(showError) }],
    });
    expect(host.errorState()).toBe(false);
    showError.set(true);
    expect(host.errorState()).toBe(true);
  });

  it('errorState falls back to an ancestor aggregator when no field host wraps the control', () => {
    aggregatorShouldShow.set(false);
    const fixture = TestBed.createComponent(AggregatorParent);
    fixture.detectChanges();
    const probe = fixture.debugElement.children[0].componentInstance as Probe;
    expect(probe.groupHost.errorState()).toBe(false);
    aggregatorShouldShow.set(true);
    expect(probe.groupHost.errorState()).toBe(true);
    aggregatorShouldShow.set(false);
  });

  it('skips an aggregator provided on the host itself (skipSelf)', () => {
    aggregatorShouldShow.set(true);
    const fixture = TestBed.createComponent(SelfAggregatorProbe);
    fixture.detectChanges();
    expect(fixture.componentInstance.groupHost.errorState()).toBe(false);
    aggregatorShouldShow.set(false);
  });

  it('ariaInvalid ORs the invalid model with errorState', () => {
    const invalid = signal(false);
    const showError = signal(false);
    const host = setupHost({
      invalid,
      providers: [{ provide: CNGX_FORM_FIELD_HOST, useValue: makeFieldHost(showError) }],
    });
    expect(host.ariaInvalid()).toBe(false);
    invalid.set(true);
    expect(host.ariaInvalid()).toBe(true);
    invalid.set(false);
    showError.set(true);
    expect(host.ariaInvalid()).toBe(true);
  });

  it('the explicit state option wins over a discovered CNGX_STATEFUL', () => {
    const inputState = createManualState<string>();
    const discovered = createManualState<string>();
    discovered.set('loading');
    const stateOption = signal<CngxAsyncState<unknown> | undefined>(inputState);
    const host = setupHost({
      state: stateOption,
      providers: [{ provide: CNGX_STATEFUL, useValue: { state: discovered } }],
    });
    expect(host.resolvedState()).toBe(inputState);
    expect(host.ariaBusy()).toBe(false);
  });

  it('falls back to the discovered CNGX_STATEFUL while the state option is undefined', () => {
    const discovered = createManualState<string>();
    const stateOption = signal<CngxAsyncState<unknown> | undefined>(undefined);
    const host = setupHost({
      state: stateOption,
      providers: [{ provide: CNGX_STATEFUL, useValue: { state: discovered } }],
    });
    expect(host.resolvedState()).toBe(discovered);
    discovered.set('loading');
    expect(host.ariaBusy()).toBe(true);
  });

  it('resolves to undefined without either source', () => {
    const host = setupHost();
    expect(host.resolvedState()).toBeUndefined();
    expect(host.ariaBusy()).toBe(false);
  });

  it('ariaBusy reflects only the loading status, not pending or refreshing', () => {
    const state = createManualState<string>();
    const host = setupHost({
      state: signal<CngxAsyncState<unknown> | undefined>(state),
    });
    state.set('loading');
    expect(host.ariaBusy()).toBe(true);
    state.set('pending');
    expect(host.ariaBusy()).toBe(false);
    state.set('refreshing');
    expect(host.ariaBusy()).toBe(false);
    state.setSuccess('ok');
    expect(host.ariaBusy()).toBe(false);
  });

  it('ariaLabelledBy resolves the field-host labelId', () => {
    const host = setupHost({
      providers: [
        {
          provide: CNGX_FORM_FIELD_HOST,
          useValue: makeFieldHost(signal(false), signal('field-label-1')),
        },
      ],
    });
    expect(host.ariaLabelledBy()).toBe('field-label-1');
  });

  it('ariaLabelledBy stays null without a field host', () => {
    const host = setupHost();
    expect(host.ariaLabelledBy()).toBeNull();
  });

  it('ariaLabelledBy stays null for field hosts without a labelId channel', () => {
    const host = setupHost({
      providers: [{ provide: CNGX_FORM_FIELD_HOST, useValue: makeFieldHost(signal(false)) }],
    });
    expect(host.ariaLabelledBy()).toBeNull();
  });

  it('an explicit labelledBy option wins over the field-label reference', () => {
    const labelledBy = signal<string | undefined>('consumer-label-id');
    const host = setupHost({
      labelledBy,
      providers: [
        {
          provide: CNGX_FORM_FIELD_HOST,
          useValue: makeFieldHost(signal(false), signal('field-label-1')),
        },
      ],
    });
    expect(host.ariaLabelledBy()).toBe('consumer-label-id');
    labelledBy.set(undefined);
    expect(host.ariaLabelledBy()).toBe('field-label-1');
  });

  it('an explicit label suppresses ariaLabelledBy until cleared', () => {
    const label = signal<string | undefined>('Explicit name');
    const host = setupHost({
      label,
      providers: [
        {
          provide: CNGX_FORM_FIELD_HOST,
          useValue: makeFieldHost(signal(false), signal('field-label-1')),
        },
      ],
    });
    expect(host.ariaLabelledBy()).toBeNull();
    label.set(undefined);
    expect(host.ariaLabelledBy()).toBe('field-label-1');
  });
});
