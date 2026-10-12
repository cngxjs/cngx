import { computePosition, flip, shift } from '@floating-ui/dom';
import { describe, expect, it } from 'vitest';

import { CNGX_FLOATING_FALLBACK, type ComputePositionFn, provideFloatingFallback } from './floating-fallback';

describe('provideFloatingFallback', () => {
  // Compiles only while Floating UI's computePosition, with its narrower
  // Placement and Middleware types, is assignable to ComputePositionFn.
  it('takes the real @floating-ui/dom computePosition and middleware', () => {
    const fn: ComputePositionFn = computePosition;
    const provider = provideFloatingFallback(computePosition, [flip(), shift()]);

    expect(provider).toEqual({
      provide: CNGX_FLOATING_FALLBACK,
      useValue: { computePosition: fn, middleware: [expect.objectContaining({ name: 'flip' }), expect.objectContaining({ name: 'shift' })] },
    });
  });
});
