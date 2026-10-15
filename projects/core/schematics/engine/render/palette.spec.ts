import { describe, expect, it } from 'vitest';

import { createPalette } from './palette';

const ANSI = /\u001b\[/;

describe('createPalette', () => {
  it('colours on a terminal by default', () => {
    const palette = createPalette({}, true);

    expect(palette.enabled).toBe(true);
    expect(palette.green('ok')).toMatch(ANSI);
  });

  it('is plain without a terminal', () => {
    const palette = createPalette({}, false);

    expect(palette.enabled).toBe(false);
    expect(palette.green('ok')).toBe('ok');
  });

  it('honours NO_COLOR on a terminal', () => {
    const palette = createPalette({ NO_COLOR: '1' }, true);

    expect(palette.enabled).toBe(false);
    expect(palette.bold('ok')).toBe('ok');
  });

  it('ignores an empty NO_COLOR', () => {
    expect(createPalette({ NO_COLOR: '' }, true).enabled).toBe(true);
  });

  it('lets NO_COLOR win over FORCE_COLOR', () => {
    expect(createPalette({ NO_COLOR: '1', FORCE_COLOR: '1' }, true).enabled).toBe(false);
  });

  it('forces colour without a terminal', () => {
    const palette = createPalette({ FORCE_COLOR: '1' }, false);

    expect(palette.enabled).toBe(true);
    expect(palette.red('x')).toMatch(ANSI);
  });

  it.each(['0', 'false'])('turns colour off for FORCE_COLOR=%s', (value) => {
    expect(createPalette({ FORCE_COLOR: value }, true).enabled).toBe(false);
  });

  it('does not mutate the env it reads', () => {
    const env = { FORCE_COLOR: '1' };
    createPalette(env, false);

    expect(env).toEqual({ FORCE_COLOR: '1' });
  });
});
