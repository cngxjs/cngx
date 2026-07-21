import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { createManualState } from '../async-state/create-manual-state';
import { injectAsyncState } from '../async-state/inject-async-state';
import { CngxAsyncRegistry } from './async-registry';
import { provideAsyncRegistry } from './provide-async-registry';

function setupRegistry(): CngxAsyncRegistry {
  TestBed.configureTestingModule({ providers: [provideAsyncRegistry()] });
  return TestBed.inject(CngxAsyncRegistry);
}

describe('CngxAsyncRegistry', () => {
  it('isAnythingLoading reflects any registered loading state', () => {
    const registry = setupRegistry();
    const a = createManualState<number>();
    const b = createManualState<number>();
    registry.register(a, 'a');
    registry.register(b, 'b');

    expect(registry.isAnythingLoading()).toBe(false);

    a.set('loading');
    expect(registry.isAnythingLoading()).toBe(true);

    a.setSuccess(1);
    expect(registry.isAnythingLoading()).toBe(false);

    b.set('refreshing');
    expect(registry.isAnythingLoading()).toBe(true);
  });

  it('reacts to an inner status flip without replacing the operations map', () => {
    const registry = setupRegistry();
    const a = createManualState<number>();
    registry.register(a, 'a');

    expect(registry.activeOperations()[0].status).toBe('idle');

    a.set('loading');
    expect(registry.activeOperations()[0].status).toBe('loading');
    expect(registry.isAnythingLoading()).toBe(true);
  });

  it('keys by uid so same-label operations stay independent', () => {
    const registry = setupRegistry();
    const a = createManualState<number>();
    const b = createManualState<number>();
    const idA = registry.register(a, 'shared');
    const idB = registry.register(b, 'shared');

    expect(idA).not.toBe(idB);
    expect(registry.activeOperations()).toHaveLength(2);
    expect(registry.activeOperations().every((op) => op.label === 'shared')).toBe(true);

    a.set('loading');
    registry.unregister(idA);

    const ops = registry.activeOperations();
    expect(ops).toHaveLength(1);
    expect(ops[0].id).toBe(idB);
    expect(ops[0].label).toBe('shared');
    expect(registry.isAnythingLoading()).toBe(false);
  });

  it('tracks unlabeled operations independently', () => {
    const registry = setupRegistry();
    const a = createManualState<number>();
    const b = createManualState<number>();
    registry.register(a);
    const idB = registry.register(b);

    expect(registry.activeOperations()).toHaveLength(2);
    expect(registry.activeOperations().every((op) => op.label === undefined)).toBe(true);

    registry.unregister(idB);
    expect(registry.activeOperations()).toHaveLength(1);
  });

  it('unregister is a no-op for an unknown id', () => {
    const registry = setupRegistry();
    const a = createManualState<number>();
    const id = registry.register(a);

    registry.unregister('cngx-async-op-does-not-exist');
    expect(registry.activeOperations()).toHaveLength(1);

    registry.unregister(id);
    expect(registry.activeOperations()).toHaveLength(0);
  });

  it('registers via injectAsyncState({ register: true }) and cleans up on destroy', () => {
    TestBed.configureTestingModule({ providers: [provideAsyncRegistry()] });
    const registry = TestBed.inject(CngxAsyncRegistry);

    @Component({ template: '' })
    class Host {
      readonly state = injectAsyncState(() => Promise.resolve([1, 2]), {
        register: true,
        label: 'host',
      });
    }

    const fixture = TestBed.createComponent(Host);
    expect(registry.activeOperations().some((op) => op.label === 'host')).toBe(true);

    fixture.destroy();
    expect(registry.activeOperations().some((op) => op.label === 'host')).toBe(false);
  });
});
