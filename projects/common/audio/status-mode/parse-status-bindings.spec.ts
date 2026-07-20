import { describe, expect, it } from 'vitest';
import { parseStatusBindings } from './parse-status-bindings';

describe('parseStatusBindings', () => {
  it('parses a single status:earcon pair', () => {
    const { bindings } = parseStatusBindings('pending:tap');
    expect(bindings.get('pending')).toBe('tap');
  });

  it('parses multiple comma-separated pairs', () => {
    const { bindings } = parseStatusBindings('pending:tap, success:success, error:error');
    expect(bindings.get('pending')).toBe('tap');
    expect(bindings.get('success')).toBe('success');
    expect(bindings.get('error')).toBe('error');
  });

  it('normalises the succeeded/failed aliases to success/error', () => {
    const { bindings } = parseStatusBindings('succeeded:complete, failed:error');
    expect(bindings.get('success')).toBe('complete');
    expect(bindings.get('error')).toBe('error');
  });

  it('tolerates surrounding whitespace', () => {
    const { bindings } = parseStatusBindings('  refreshing :  notification ');
    expect(bindings.get('refreshing')).toBe('notification');
  });

  it('returns empty maps for an empty spec', () => {
    const parsed = parseStatusBindings('');
    expect(parsed.bindings.size).toBe(0);
    expect(parsed.domEventKeys).toHaveLength(0);
    expect(parsed.unknownKeys).toHaveLength(0);
  });

  it('flags DOM-event keys separately (contamination hint)', () => {
    const { bindings, domEventKeys } = parseStatusBindings('click:tap, pointerenter:notification');
    expect(bindings.size).toBe(0);
    expect(domEventKeys).toEqual(['click', 'pointerenter']);
  });

  it('collects unknown keys', () => {
    const { bindings, unknownKeys } = parseStatusBindings('done:tap');
    expect(bindings.size).toBe(0);
    expect(unknownKeys).toEqual(['done']);
  });

  it('treats a missing colon as an unknown key', () => {
    const { unknownKeys } = parseStatusBindings('pending');
    expect(unknownKeys).toEqual(['pending']);
  });

  it('ignores a pair whose earcon is blank', () => {
    const { bindings } = parseStatusBindings('pending:');
    expect(bindings.size).toBe(0);
  });
});
