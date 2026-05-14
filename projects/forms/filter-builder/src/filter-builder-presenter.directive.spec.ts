import { Component, signal, viewChild, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CNGX_STATEFUL } from '@cngx/core/utils';
import { CNGX_FORM_FIELD_CONTROL } from '@cngx/forms/field';
import { describe, expect, it } from 'vitest';

import type { FilterFieldDef, FilterGroup } from './filter-builder.types';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';

const FIELD_NAME: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
const FIELD_AGE: FilterFieldDef = { key: 'age', label: 'Age', editorType: 'number' };

@Component({
  template: `<div
    cngxFilterBuilderPresenter
    [fields]="fields()"
    [(value)]="value"
  ></div>`,
  imports: [CngxFilterBuilderPresenter],
})
class Host {
  readonly fields = signal<readonly FilterFieldDef[]>([FIELD_NAME, FIELD_AGE]);
  value: FilterGroup = { type: 'group', logic: 'and', negated: false, filters: [] };
  readonly directive = viewChild.required(CngxFilterBuilderPresenter);
}

function setup(overrides: Partial<Host> = {}): {
  fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  host: Host;
  directive: CngxFilterBuilderPresenter;
} {
  const fixture = TestBed.createComponent(Host);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  TestBed.flushEffects();
  const host = fixture.componentInstance;
  return { fixture, host, directive: host.directive() };
}

describe('CngxFilterBuilderPresenter', () => {
  it('mounts with an exportAs handle', () => {
    const { directive } = setup();
    expect(directive).toBeTruthy();
    expect(directive.tree()).toBeDefined();
    expect(directive.isEmpty()).toBe(true);
  });

  it('flows mutator writes back through the consumer value model', () => {
    const { fixture, host, directive } = setup();

    directive.setLogic([], 'or');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(host.value.logic).toBe('or');
    expect(directive.tree().logic).toBe('or');
  });

  it('reflects programmatic value() writes into tree() (consumer-side)', () => {
    const { fixture, directive } = setup();
    const next: FilterGroup = {
      type: 'group',
      logic: 'or',
      negated: true,
      filters: [],
    };

    directive.value.set(next);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(directive.tree()).toEqual(next);
  });

  it('resolves CNGX_FILTER_BUILDER_HOST / CNGX_STATEFUL / CNGX_FORM_FIELD_CONTROL to the same instance', () => {
    const { directive } = setup();
    const injector = directive['core'] // throwaway access to confirm directive is mounted
      ? null
      : null;
    void injector;

    const hostToken = TestBed.inject(CNGX_FILTER_BUILDER_HOST, undefined, { optional: true });
    expect(hostToken).toBeNull(); // root injector cannot see the directive-scoped providers

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    const inner = fixture.debugElement.children[0].injector;

    expect(inner.get(CNGX_FILTER_BUILDER_HOST)).toBe(inner.get(CngxFilterBuilderPresenter));
    expect(inner.get(CNGX_STATEFUL)).toBe(inner.get(CngxFilterBuilderPresenter));
    expect(inner.get(CNGX_FORM_FIELD_CONTROL)).toBe(inner.get(CngxFilterBuilderPresenter));
  });

  it('coerces empty-string `cngxFilterBuilderState` to undefined', () => {
    const { directive } = setup();
    expect(directive.stateInput()).toBeUndefined();
    expect(directive.state).toBeDefined();
    expect(directive.state.status()).toBe('idle');
  });

  it('exposes Signal<string> id', () => {
    const { directive } = setup();
    expect(typeof directive.id()).toBe('string');
    expect(directive.id()).toMatch(/^cngx-filter-builder-/);
  });

  it('flags isEmpty derivation', () => {
    const { fixture, directive } = setup();
    expect(directive.empty()).toBe(true);

    directive.addExpression([], { type: 'expression', field: 'name', operator: 'eq', value: 'x' });
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(directive.empty()).toBe(false);
  });

  it('exposes disabled/focused/errorState as read-only signals (no .set leak)', () => {
    const { directive } = setup();
    const disabled = directive.disabled as Signal<boolean> & { set?: unknown };
    const focused = directive.focused as Signal<boolean> & { set?: unknown };
    const errorState = directive.errorState as Signal<boolean> & { set?: unknown };
    expect(disabled.set).toBeUndefined();
    expect(focused.set).toBeUndefined();
    expect(errorState.set).toBeUndefined();
  });
});
