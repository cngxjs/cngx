import { describe, expect, it } from 'vitest';

import {
  ANCHOR_AREA_PROPERTY,
  POSITION_AREA,
  SUPPORTS_ANCHOR,
} from './anchor-positioning';
import type { PopoverPlacement } from './popover.types';

describe('POSITION_AREA mapping', () => {
  const expected: Record<PopoverPlacement, string> = {
    top: 'top span-all',
    'top-start': 'top span-right',
    'top-end': 'top span-left',
    bottom: 'bottom span-all',
    'bottom-start': 'bottom span-right',
    'bottom-end': 'bottom span-left',
    left: 'left span-all',
    'left-start': 'left span-bottom',
    'left-end': 'left span-top',
    right: 'right span-all',
    'right-start': 'right span-bottom',
    'right-end': 'right span-top',
  };

  for (const placement of Object.keys(expected) as PopoverPlacement[]) {
    it(`maps "${placement}" to "${expected[placement]}"`, () => {
      expect(POSITION_AREA[placement]).toBe(expected[placement]);
    });
  }

  it('covers every PopoverPlacement value (12 entries)', () => {
    expect(Object.keys(POSITION_AREA)).toHaveLength(12);
  });

  it('never emits a corner-cell value (the pre-fix shape)', () => {
    // Corner cells (two-direction pairs) are valid `position-area` syntax
    // but produce diagonal placement — wrong for edge-aligned popovers.
    const cornerCells = ['top left', 'top right', 'bottom left', 'bottom right'];
    for (const value of Object.values(POSITION_AREA)) {
      expect(cornerCells).not.toContain(value);
    }
  });
});

describe('anchor-support resolution', () => {
  it('SUPPORTS_ANCHOR is a boolean', () => {
    expect(typeof SUPPORTS_ANCHOR).toBe('boolean');
  });

  it('ANCHOR_AREA_PROPERTY resolves to position-area or inset-area', () => {
    expect(['position-area', 'inset-area']).toContain(ANCHOR_AREA_PROPERTY);
  });

  it('jsdom defaults to position-area when CSS.supports rejects both', () => {
    // jsdom's CSS.supports returns false for both `position-area` and
    // `inset-area` — the unsupported path falls back to `position-area`
    // as the canonical property name (Chrome 129+ default).
    if (!SUPPORTS_ANCHOR) {
      expect(ANCHOR_AREA_PROPERTY).toBe('position-area');
    }
  });
});
