import { describe, expect, it } from 'vitest';

import {
  ANCHOR_AREA_PROPERTY,
  POSITION_AREA,
  resolveDirectionalPlacement,
  resolveFloatingPlacement,
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

describe('resolveDirectionalPlacement', () => {
  const allTokens: PopoverPlacement[] = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'left-start',
    'left-end',
    'right',
    'right-start',
    'right-end',
  ];

  const rtlMirror: Record<PopoverPlacement, PopoverPlacement> = {
    top: 'top',
    'top-start': 'top-end',
    'top-end': 'top-start',
    bottom: 'bottom',
    'bottom-start': 'bottom-end',
    'bottom-end': 'bottom-start',
    left: 'right',
    'left-start': 'right-start',
    'left-end': 'right-end',
    right: 'left',
    'right-start': 'left-start',
    'right-end': 'left-end',
  };

  for (const token of allTokens) {
    it(`ltr is the identity for "${token}"`, () => {
      expect(resolveDirectionalPlacement(token, 'ltr')).toBe(token);
    });

    it(`rtl mirrors "${token}" to "${rtlMirror[token]}"`, () => {
      expect(resolveDirectionalPlacement(token, 'rtl')).toBe(rtlMirror[token]);
    });
  }

  it('leaves the block axis (top/bottom) invariant under both directions', () => {
    for (const token of ['top', 'bottom'] as PopoverPlacement[]) {
      expect(resolveDirectionalPlacement(token, 'ltr')).toBe(token);
      expect(resolveDirectionalPlacement(token, 'rtl')).toBe(token);
    }
  });

  it('is its own inverse under rtl (mirroring twice returns the original)', () => {
    for (const token of allTokens) {
      const once = resolveDirectionalPlacement(token, 'rtl');
      expect(resolveDirectionalPlacement(once, 'rtl')).toBe(token);
    }
  });

  it('never crosses the block edge (a top-* token never becomes bottom-*)', () => {
    for (const token of allTokens) {
      const resolved = resolveDirectionalPlacement(token, 'rtl');
      const blockEdge = (t: PopoverPlacement) =>
        t.startsWith('top') ? 'top' : t.startsWith('bottom') ? 'bottom' : 'inline';
      if (blockEdge(token) !== 'inline') {
        expect(blockEdge(resolved)).toBe(blockEdge(token));
      }
    }
  });
});

describe('resolveFloatingPlacement (side-only mirror for the floating-ui path)', () => {
  const allTokens: PopoverPlacement[] = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'left-start',
    'left-end',
    'right',
    'right-start',
    'right-end',
  ];

  // Under rtl only the physical side swaps; the inline alignment of a vertical
  // placement is left for @floating-ui/dom to flip (its computePosition reads
  // the floating element's direction). A full mirror here would double-flip.
  const rtlSideMirror: Record<PopoverPlacement, PopoverPlacement> = {
    top: 'top',
    'top-start': 'top-start',
    'top-end': 'top-end',
    bottom: 'bottom',
    'bottom-start': 'bottom-start',
    'bottom-end': 'bottom-end',
    left: 'right',
    'left-start': 'right-start',
    'left-end': 'right-end',
    right: 'left',
    'right-start': 'left-start',
    'right-end': 'left-end',
  };

  for (const token of allTokens) {
    it(`ltr is the identity for "${token}"`, () => {
      expect(resolveFloatingPlacement(token, 'ltr')).toBe(token);
    });

    it(`rtl side-mirrors "${token}" to "${rtlSideMirror[token]}"`, () => {
      expect(resolveFloatingPlacement(token, 'rtl')).toBe(rtlSideMirror[token]);
    });
  }

  it('leaves vertical-placement alignment untouched under rtl (no double-flip vs floating-ui)', () => {
    // The regression this guards: pre-flipping top-start -> top-end here plus
    // floating-ui's own rtl alignment flip renders top-start in the ltr spot.
    for (const token of ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as PopoverPlacement[]) {
      expect(resolveFloatingPlacement(token, 'rtl')).toBe(token);
    }
  });

  it('agrees with the full mirror on side placements, diverges only on vertical alignment', () => {
    for (const token of ['left', 'right', 'left-start', 'right-start', 'left-end', 'right-end'] as PopoverPlacement[]) {
      expect(resolveFloatingPlacement(token, 'rtl')).toBe(resolveDirectionalPlacement(token, 'rtl'));
    }
    for (const token of ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as PopoverPlacement[]) {
      expect(resolveFloatingPlacement(token, 'rtl')).not.toBe(resolveDirectionalPlacement(token, 'rtl'));
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
