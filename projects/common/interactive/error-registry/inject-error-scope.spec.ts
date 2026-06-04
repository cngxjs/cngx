import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxErrorRegistry } from './error-registry';
import { injectErrorScope } from './inject-error-scope';

@Component({ template: '', standalone: true })
class HostNoName {
  readonly scope = injectErrorScope();
}

@Component({ template: '', standalone: true })
class HostNamed {
  readonly scope = injectErrorScope('checkout');
}

@Component({ template: '', standalone: true })
class HostWithRegistryProbe {
  readonly registry = inject(CngxErrorRegistry, { optional: true });
  readonly scope = injectErrorScope('field-a');
}

describe('injectErrorScope', () => {
  it('returns a CngxErrorScopeContract honouring reveal/reset toggles', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(HostNoName);
    const { scope } = fixture.componentInstance;

    expect(scope.showErrors()).toBe(false);
    scope.reveal();
    expect(scope.showErrors()).toBe(true);
    scope.reset();
    expect(scope.showErrors()).toBe(false);
  });

  it('reveal/reset are idempotent', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(HostNoName);
    const { scope } = fixture.componentInstance;

    scope.reveal();
    scope.reveal();
    expect(scope.showErrors()).toBe(true);

    scope.reset();
    scope.reset();
    expect(scope.showErrors()).toBe(false);
  });

  it('exposes the supplied name on scopeName', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(HostNamed);
    expect(fixture.componentInstance.scope.scopeName?.()).toBe('checkout');
  });

  it('does not register when no registry is provided', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(HostWithRegistryProbe);
    expect(fixture.componentInstance.registry).toBeNull();
    expect(fixture.componentInstance.scope.showErrors()).toBe(false);
  });

  it('auto-registers under the supplied name when a registry is provided', () => {
    TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
    const registry = TestBed.inject(CngxErrorRegistry);
    expect(registry.getScope('field-a')).toBeUndefined();

    const fixture = TestBed.createComponent(HostWithRegistryProbe);
    const { scope } = fixture.componentInstance;
    expect(registry.getScope('field-a')).toBe(scope);

    fixture.componentInstance.scope.reveal();
    expect(registry.getScope('field-a')?.showErrors()).toBe(true);
  });

  it('auto-deregisters on host destroy', () => {
    TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
    const registry = TestBed.inject(CngxErrorRegistry);
    const fixture = TestBed.createComponent(HostWithRegistryProbe);
    expect(registry.getScope('field-a')).toBeDefined();

    fixture.destroy();
    expect(registry.getScope('field-a')).toBeUndefined();
  });

  it('auto-deregisters when name is provided alongside an empty registry', () => {
    TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
    const registry = TestBed.inject(CngxErrorRegistry);
    const fixture = TestBed.createComponent(HostNamed);
    expect(registry.getScope('checkout')).toBeDefined();

    fixture.destroy();
    expect(registry.getScope('checkout')).toBeUndefined();
  });

  it('skips registration when no name is given even with a registry present', () => {
    TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
    const registry = TestBed.inject(CngxErrorRegistry);

    const fixture = TestBed.createComponent(HostNoName);
    void fixture.componentInstance.scope;

    expect(registry.errorAggregators()).toEqual([]);
    expect(registry.getScope('checkout')).toBeUndefined();
  });

  it('reveal mutations after destroy do not re-register', () => {
    TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
    const registry = TestBed.inject(CngxErrorRegistry);
    const fixture = TestBed.createComponent(HostWithRegistryProbe);
    const { scope } = fixture.componentInstance;
    fixture.destroy();

    scope.reveal();
    expect(registry.getScope('field-a')).toBeUndefined();
  });
});
