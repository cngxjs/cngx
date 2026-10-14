import { describe, expect, it } from 'vitest';

import { readTerminal } from './terminal';

describe('readTerminal', () => {
  it('reads an interactive terminal outside CI', () => {
    expect(readTerminal({}, { isTTY: true })).toEqual({ isTTY: true, ci: false });
  });

  it('reads a terminal under CI as none', () => {
    expect(readTerminal({ CI: 'true' }, { isTTY: true })).toEqual({ isTTY: false, ci: true });
  });

  it('reads CI=false, CI=0 and an empty CI as not CI', () => {
    for (const value of ['false', '0', '']) {
      expect(readTerminal({ CI: value }, { isTTY: true })).toEqual({ isTTY: true, ci: false });
    }
  });

  it('reads a piped or redirected stdout as no terminal', () => {
    expect(readTerminal({}, {})).toEqual({ isTTY: false, ci: false });
    expect(readTerminal({}, { isTTY: false })).toEqual({ isTTY: false, ci: false });
  });
});
