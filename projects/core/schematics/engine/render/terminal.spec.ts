import { describe, expect, it } from 'vitest';

import { type RenderLogger } from './renderer';
import { canReachPrompts, createShellRendererOptions, isCi } from './terminal';

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
    expect(result.quiet).toBe(false);
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
    expect(options({}, true, true).quiet).toBe(true);
  });
});

describe('isCi', () => {
  it('reads a set CI variable as CI', () => {
    expect(isCi({ CI: 'true' })).toBe(true);
    expect(isCi({ CI: '1' })).toBe(true);
  });

  it('reads an unset, empty, false or 0 CI variable as not CI', () => {
    for (const env of [{}, { CI: '' }, { CI: 'false' }, { CI: '0' }]) {
      expect(isCi(env)).toBe(false);
    }
  });

  it('reads only 1 and true as CI, the way the Angular CLI does', () => {
    expect(isCi({ CI: 'TRUE' })).toBe(true);
    expect(isCi({ CI: 'yes' })).toBe(false);
    expect(isCi({ CI: 'woodpecker' })).toBe(false);
  });
});

describe('NG_FORCE_TTY', () => {
  it('forces the terminal on under CI and off on a terminal', () => {
    expect(options({ CI: 'true', NG_FORCE_TTY: '1' }, false).isTTY).toBe(true);
    expect(options({ NG_FORCE_TTY: 'false' }, true).isTTY).toBe(false);
    expect(options({ NG_FORCE_TTY: 'maybe' }, true).isTTY).toBe(true);
  });
});

describe('canReachPrompts', () => {
  it('needs an interactive stdin next to the terminal', () => {
    expect(canReachPrompts({}, true, { isTTY: true })).toBe(true);
    expect(canReachPrompts({}, true, { isTTY: false })).toBe(false);
    expect(canReachPrompts({}, true, {})).toBe(false);
    expect(canReachPrompts({}, false, { isTTY: true })).toBe(false);
  });

  it('follows NG_FORCE_TTY for stdin too', () => {
    expect(canReachPrompts({ NG_FORCE_TTY: 'true' }, true, {})).toBe(true);
  });
});
