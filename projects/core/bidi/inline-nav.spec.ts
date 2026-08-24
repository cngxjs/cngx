import { resolveInlineArrowKey, resolveInlineStep } from './inline-nav';

describe('resolveInlineStep', () => {
  it('advances on ArrowRight and retreats on ArrowLeft under ltr', () => {
    expect(resolveInlineStep('ArrowRight', 'ltr')).toBe(1);
    expect(resolveInlineStep('ArrowLeft', 'ltr')).toBe(-1);
  });

  it('swaps the horizontal arrows under rtl', () => {
    expect(resolveInlineStep('ArrowRight', 'rtl')).toBe(-1);
    expect(resolveInlineStep('ArrowLeft', 'rtl')).toBe(1);
  });

  it('returns null for block-axis and non-arrow keys in both directions', () => {
    for (const dir of ['ltr', 'rtl'] as const) {
      expect(resolveInlineStep('ArrowUp', dir)).toBeNull();
      expect(resolveInlineStep('ArrowDown', dir)).toBeNull();
      expect(resolveInlineStep('Home', dir)).toBeNull();
      expect(resolveInlineStep('End', dir)).toBeNull();
      expect(resolveInlineStep('a', dir)).toBeNull();
    }
  });
});

describe('resolveInlineArrowKey', () => {
  it('returns the key verbatim under ltr', () => {
    expect(resolveInlineArrowKey('ArrowLeft', 'ltr')).toBe('ArrowLeft');
    expect(resolveInlineArrowKey('ArrowRight', 'ltr')).toBe('ArrowRight');
    expect(resolveInlineArrowKey('ArrowUp', 'ltr')).toBe('ArrowUp');
  });

  it('swaps the horizontal arrows under rtl', () => {
    expect(resolveInlineArrowKey('ArrowLeft', 'rtl')).toBe('ArrowRight');
    expect(resolveInlineArrowKey('ArrowRight', 'rtl')).toBe('ArrowLeft');
  });

  it('passes non-horizontal keys through unchanged under rtl', () => {
    expect(resolveInlineArrowKey('ArrowUp', 'rtl')).toBe('ArrowUp');
    expect(resolveInlineArrowKey('ArrowDown', 'rtl')).toBe('ArrowDown');
    expect(resolveInlineArrowKey('Home', 'rtl')).toBe('Home');
    expect(resolveInlineArrowKey('Enter', 'rtl')).toBe('Enter');
  });
});
