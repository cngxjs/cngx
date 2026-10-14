import { describe, expect, it } from 'vitest';

import { type RenderLogger } from '../../engine';
import { createShellRendererOptions } from './terminal';

const LOGGER: RenderLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

const options = (env: Record<string, string>, isTTY: boolean | undefined, quiet = false) =>
  createShellRendererOptions(env, { isTTY }, LOGGER, quiet);

describe('createShellRendererOptions', () => {
  it('asks for the live renderer on an interactive, coloured terminal outside CI', () => {
    const result = options({}, true);

    expect(result.isTTY).toBe(true);
    expect(result.color.enabled).toBe(true);
    expect(result.verbosity).toBe('normal');
    expect(result.logger).toBe(LOGGER);
  });

  it('reads a terminal under CI as none', () => {
    const result = options({ CI: 'true' }, true);

    expect(result.isTTY).toBe(false);
    expect(result.color.enabled).toBe(false);
  });

  it('reads CI=false, CI=0 and an empty CI as not CI', () => {
    for (const value of ['false', '0', '']) {
      expect(options({ CI: value }, true).isTTY).toBe(true);
    }
  });

  it('reads a piped or redirected stdout as no terminal', () => {
    expect(options({}, undefined).isTTY).toBe(false);
    expect(options({}, false).isTTY).toBe(false);
  });

  it('turns colour off for NO_COLOR and keeps the terminal', () => {
    const result = options({ NO_COLOR: '1' }, true);

    expect(result.isTTY).toBe(true);
    expect(result.color.enabled).toBe(false);
  });

  it('prints only the summary under --quiet', () => {
    expect(options({}, true, true).verbosity).toBe('quiet');
  });
});
