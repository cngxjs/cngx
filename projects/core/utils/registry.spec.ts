import { describe, expect, it, vi } from 'vitest';

import { createKeyedRegistry, createSlotRegistry } from './registry';

describe('createKeyedRegistry', () => {
  it('registers and exposes entries and values in registration order', () => {
    const registry = createKeyedRegistry<string>();
    registry.register('a', 'first');
    registry.register('b', 'second');
    expect(registry.get('a')).toBe('first');
    expect(registry.values()).toEqual(['first', 'second']);
    expect(Array.from(registry.entries().keys())).toEqual(['a', 'b']);
  });

  it('is idempotent for the same (key, value) pair', () => {
    const registry = createKeyedRegistry<string>();
    registry.register('a', 'first');
    const before = registry.entries();
    registry.register('a', 'first');
    expect(registry.entries()).toBe(before);
  });

  it('absorbs a collision swap-is-noop and warns in dev mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registry = createKeyedRegistry<string>({ name: 'TestRegistry' });
    registry.register('a', 'first');
    registry.register('a', 'second');
    expect(registry.get('a')).toBe('first');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('TestRegistry');
    warn.mockRestore();
  });

  it('unregisters only while the caller still holds the key', () => {
    const registry = createKeyedRegistry<string>();
    registry.register('a', 'first');
    registry.unregister('a', 'first');
    expect(registry.get('a')).toBeNull();
    expect(registry.values()).toEqual([]);
  });

  it('keeps a successor registration alive when a stale holder unregisters late', () => {
    // Angular recreate order: the successor's register can run BEFORE the
    // predecessor's DestroyRef teardown. The stale unregister must be a no-op.
    const registry = createKeyedRegistry<string>();
    registry.register('a', 'predecessor');
    registry.unregister('a', 'predecessor');
    registry.register('a', 'successor');
    registry.unregister('a', 'predecessor');
    expect(registry.get('a')).toBe('successor');
  });

  it('ignores an unregister for an unknown key', () => {
    const registry = createKeyedRegistry<string>();
    const before = registry.entries();
    registry.unregister('ghost', 'value');
    expect(registry.entries()).toBe(before);
  });
});

describe('createSlotRegistry', () => {
  it('claims the slot last-write-wins', () => {
    const slot = createSlotRegistry<string>();
    slot.register('first');
    slot.register('second');
    expect(slot.current()).toBe('second');
  });

  it('releases the slot only while the caller still holds it', () => {
    const slot = createSlotRegistry<string>();
    slot.register('holder');
    slot.unregister('holder');
    expect(slot.current()).toBeNull();
  });

  it('keeps a successor claim alive when a replaced holder releases late', () => {
    const slot = createSlotRegistry<string>();
    slot.register('predecessor');
    slot.register('successor');
    slot.unregister('predecessor');
    expect(slot.current()).toBe('successor');
  });
});
