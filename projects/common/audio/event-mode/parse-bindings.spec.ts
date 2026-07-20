import { describe, expect, it } from 'vitest';
import { parseEventBindings } from './parse-bindings';

describe('parseEventBindings', () => {
  it('parses a single event:earcon pair', () => {
    const { bindings } = parseEventBindings('click:tap');
    expect(bindings.get('click')).toBe('tap');
  });

  it('parses multiple comma-separated pairs', () => {
    const { bindings } = parseEventBindings('click:tap, focus:notification');
    expect(bindings.get('click')).toBe('tap');
    expect(bindings.get('focus')).toBe('notification');
  });

  it('tolerates surrounding whitespace', () => {
    const { bindings } = parseEventBindings('  pointerenter :  complete ');
    expect(bindings.get('pointerenter')).toBe('complete');
  });

  it('returns empty maps for an empty spec', () => {
    const parsed = parseEventBindings('');
    expect(parsed.bindings.size).toBe(0);
    expect(parsed.unknownKeys).toHaveLength(0);
    expect(parsed.lifecycleKeys).toHaveLength(0);
  });

  it('flags lifecycle keys separately (contamination hint)', () => {
    const { bindings, lifecycleKeys } = parseEventBindings('pending:tap, succeeded:success');
    expect(bindings.size).toBe(0);
    expect(lifecycleKeys).toEqual(['pending', 'succeeded']);
  });

  it('collects unknown event keys', () => {
    const { bindings, unknownKeys } = parseEventBindings('hover:tap');
    expect(bindings.size).toBe(0);
    expect(unknownKeys).toEqual(['hover']);
  });

  it('treats a missing colon as an unknown key', () => {
    const { unknownKeys } = parseEventBindings('click');
    expect(unknownKeys).toEqual(['click']);
  });

  it('ignores a pair whose earcon is blank', () => {
    const { bindings } = parseEventBindings('click:');
    expect(bindings.size).toBe(0);
  });
});
