import { createColors } from 'picocolors';

type Format = (text: string) => string;

/** The colours the renderer uses; every formatter is the identity when colour is off. */
export interface Palette {
  readonly enabled: boolean;
  readonly bold: Format;
  readonly dim: Format;
  readonly green: Format;
  readonly yellow: Format;
  readonly red: Format;
  readonly cyan: Format;
}

export type ColorEnv = Readonly<Record<string, string | undefined>>;

// https://no-color.org: any non-empty NO_COLOR turns colour off.
// FORCE_COLOR follows the Node convention: "0" and "false" turn it off,
// any other value turns it on even without a terminal.
function colorEnabled(env: ColorEnv, isTTY: boolean): boolean {
  if (env['NO_COLOR'] !== undefined && env['NO_COLOR'] !== '') {
    return false;
  }
  const force = env['FORCE_COLOR'];
  if (force !== undefined) {
    return force !== '0' && force !== 'false';
  }
  return isTTY;
}

/**
 * The palette for one run. The shell passes `process.env` and the terminal
 * state; specs pass plain objects, so nothing reads the environment here.
 */
export function createPalette(env: ColorEnv, isTTY: boolean): Palette {
  const enabled = colorEnabled(env, isTTY);
  const colors = createColors(enabled);
  return {
    enabled,
    bold: colors.bold,
    dim: colors.dim,
    green: colors.green,
    yellow: colors.yellow,
    red: colors.red,
    cyan: colors.cyan,
  };
}
