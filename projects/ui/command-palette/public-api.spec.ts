import { describe, expect, it } from 'vitest';

import * as api from './public-api';

describe('@cngx/ui/command-palette public API shape', () => {
  it('exports DEFAULT_COMMAND_PALETTE_CONFIG next to the config token', () => {
    expect(api.CNGX_COMMAND_PALETTE_CONFIG).toBeDefined();
    expect(api.DEFAULT_COMMAND_PALETTE_CONFIG).toEqual({ openShortcut: expect.any(String) });
  });
});
