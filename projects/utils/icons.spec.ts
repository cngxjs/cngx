import { describe, expect, it } from 'vitest';

import * as icons from './icons';
import type { CngxIconData } from './icons';

const entries = Object.entries(icons).filter(([name]) => name.startsWith('CNGX_ICON_')) as [
  string,
  CngxIconData,
][];

// Glyphs with a signed-off 12-grid drawing; the list grows with each batch.
const MICRO_ICONS = [
  'CNGX_ICON_ALERT',
  'CNGX_ICON_BAN',
  'CNGX_ICON_BELL',
  'CNGX_ICON_CARET_DOWN',
  'CNGX_ICON_PLUS',
  'CNGX_ICON_TRASH',
  'CNGX_ICON_X_CIRCLE',
] as const;

const ARITY: Readonly<Record<string, number>> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

/**
 * Every reason a micro `d` leaves the 12 grid. Absolute commands only, so a
 * coordinate in the string is the coordinate on the grid; every number is a
 * whole unit except the arc radii, which may end in `.5`.
 */
function microGridViolations(d: string): string[] {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const violations: string[] = [];
  let index = 0;
  while (index < tokens.length) {
    const command = tokens[index++];
    const arity = ARITY[command];
    if (arity === undefined) {
      violations.push(`unsupported command ${command}`);
      while (index < tokens.length && !/[A-Za-z]/.test(tokens[index])) {
        index++;
      }
      continue;
    }
    if (arity === 0) {
      continue;
    }
    // A command letter may repeat its argument list without being restated.
    do {
      const args = tokens.slice(index, index + arity).map(Number);
      if (args.length < arity || args.some((arg) => Number.isNaN(arg))) {
        violations.push(`${command} needs ${arity} numbers`);
        return violations;
      }
      args.forEach((arg, position) => {
        const radius = command === 'A' && position < 2;
        const onGrid = radius ? Number.isInteger(arg * 2) : Number.isInteger(arg);
        if (!onGrid) {
          violations.push(`${command} ${arg} off the grid`);
        }
      });
      index += arity;
    } while (index < tokens.length && !/[A-Za-z]/.test(tokens[index]));
  }
  return violations;
}

describe('cngx default icon set', () => {
  it('exports the full default set', () => {
    expect(entries.map(([name]) => name).sort()).toEqual(
      [
        'CNGX_ICON_ALERT',
        'CNGX_ICON_BAN',
        'CNGX_ICON_CARET_DOWN',
        'CNGX_ICON_CHECK',
        'CNGX_ICON_CHEVRONS_LEFT',
        'CNGX_ICON_CHEVRONS_RIGHT',
        'CNGX_ICON_CHEVRON_LEFT',
        'CNGX_ICON_CHEVRON_RIGHT',
        'CNGX_ICON_DOT',
        'CNGX_ICON_GRIP_VERTICAL',
        'CNGX_ICON_MINUS',
        'CNGX_ICON_MORE_HORIZONTAL',
        'CNGX_ICON_MORE_VERTICAL',
        'CNGX_ICON_PLUS',
        'CNGX_ICON_TRIANGLE_DOWN',
        'CNGX_ICON_TRIANGLE_UP',
        'CNGX_ICON_X',
        'CNGX_ICON_CHEVRON_DOWN',
        'CNGX_ICON_TRASH',
        'CNGX_ICON_DOWNLOAD',
        'CNGX_ICON_X_CIRCLE',
        'CNGX_ICON_CUT',
        'CNGX_ICON_COPY',
        'CNGX_ICON_CLIPBOARD',
        'CNGX_ICON_SEARCH',
        'CNGX_ICON_ZOOM_IN',
        'CNGX_ICON_ZOOM_OUT',
        'CNGX_ICON_MAXIMIZE',
        'CNGX_ICON_UNDO',
        'CNGX_ICON_REDO',
        'CNGX_ICON_PENCIL',
        'CNGX_ICON_BELL',
        'CNGX_ICON_INFO',
        'CNGX_ICON_EXCLAMATION',
        'CNGX_ICON_EXCLAMATION_SOLID',
        'CNGX_ICON_QUESTION',
        'CNGX_ICON_INFO_CIRCLE',
        'CNGX_ICON_CHECK_CIRCLE',
        'CNGX_ICON_ARCHIVE',
        'CNGX_ICON_VOLUME',
        'CNGX_ICON_STOP',
      ].sort(),
    );
  });

  it.each(entries)('%s sits on the 24x24 grid', (_, icon) => {
    expect(icon.viewBox).toBe('0 0 24 24');
  });

  it.each(entries)('%s has a single path starting with a moveto', (_, icon) => {
    expect(icon.d).toMatch(/^M[\d.\s,-]/);
    expect(icon.d).toMatch(/^[MmLlHhVvCcSsQqTtAaZz\d.\s,-]+$/);
  });

  it.each(entries)('%s declares a valid paint', (_, icon) => {
    expect(['fill', 'stroke']).toContain(icon.paint);
  });

  it('keeps every micro drawing on the 12 grid', () => {
    const offGrid = entries.flatMap(([name, icon]) => {
      if (!icon.micro) {
        return [];
      }
      const problems = microGridViolations(icon.micro.d);
      if (icon.micro.viewBox !== '0 0 12 12') {
        problems.push(`viewBox ${icon.micro.viewBox}`);
      }
      if (!/^M[\d.\s,-]/.test(icon.micro.d)) {
        problems.push('does not start with a moveto');
      }
      if (!/^[MmLlHhVvCcSsQqTtAaZz\d.\s,-]+$/.test(icon.micro.d)) {
        problems.push('leaves the path grammar');
      }
      return problems.map((problem) => `${name}: ${problem}`);
    });
    expect(offGrid).toEqual([]);
  });

  it.each(MICRO_ICONS)('%s carries a micro drawing', (name) => {
    expect(entries.find(([entry]) => entry === name)?.[1].micro).toBeDefined();
  });

  it('draws the ban slash from top-left to bottom-right', () => {
    expect(icons.CNGX_ICON_BAN.d).toContain('M5.3 5.3l13.4 13.4');
  });

  it('keeps refused and failed visually distinct', () => {
    expect(icons.CNGX_ICON_BAN.d).not.toBe(icons.CNGX_ICON_ALERT.d);
  });

  // The severity glyphs share one circle, so info, success and error read as
  // one family and differ only by the mark inside (WCAG 1.4.1).
  it('draws the circled severity glyphs on the same circle', () => {
    const circle = 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0z';
    for (const icon of [
      icons.CNGX_ICON_INFO_CIRCLE,
      icons.CNGX_ICON_CHECK_CIRCLE,
      icons.CNGX_ICON_X_CIRCLE,
    ]) {
      expect(icon.d.startsWith(circle)).toBe(true);
    }
  });
});

// Fixtures prove the grid rule above can fail.
describe('micro grid rule', () => {
  it('accepts whole units, repeated arguments and half-unit arc radii', () => {
    expect(microGridViolations('M5 1H7L12 11H0ZM1 6A5 5 0 1 1 11 6A4.5 4.5 0 1 0 2 6Z')).toEqual(
      [],
    );
    expect(microGridViolations('M2 4L10 4 6 8Z')).toEqual([]);
  });

  it('rejects a fractional coordinate', () => {
    expect(microGridViolations('M5.5 1H7Z')).toEqual(['M 5.5 off the grid']);
  });

  it('rejects a fractional arc end point', () => {
    expect(microGridViolations('M1 6A5 5 0 1 1 10.5 6Z')).toEqual(['A 10.5 off the grid']);
  });

  it('rejects relative commands', () => {
    expect(microGridViolations('M5 1h2Z')).toEqual(['unsupported command h']);
  });

  it('rejects a command with missing arguments', () => {
    expect(microGridViolations('M5 1L7')).toEqual(['L needs 2 numbers']);
  });
});
