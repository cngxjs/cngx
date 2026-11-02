import { describe, expect, it } from 'vitest';

import type { CngxOverlayRefConfig } from './public-api';

describe('@cngx/ui/overlay public API shape', () => {
  it('exports CngxOverlayRefConfig with both options optional', () => {
    const empty: CngxOverlayRefConfig = {};
    const full: CngxOverlayRefConfig = { disableClose: true, restoreFocusTo: null };
    expect(empty.disableClose).toBeUndefined();
    expect(full.disableClose).toBe(true);
  });
});
