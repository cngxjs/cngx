import { describe, expect, it } from 'vitest';

import * as icons from './icons';
import type { CngxIconData } from './icons';

const entries = Object.entries(icons).filter(([name]) => name.startsWith('CNGX_ICON_')) as [
  string,
  CngxIconData,
][];

// Glyphs with a signed-off 12-grid drawing: every default icon except the two
// that keep the 24-grid path at every size.
const MICRO_ICONS = [
  'CNGX_ICON_ALERT',
  'CNGX_ICON_ARCHIVE',
  'CNGX_ICON_BAN',
  'CNGX_ICON_BELL',
  'CNGX_ICON_CARET_DOWN',
  'CNGX_ICON_CHECK',
  'CNGX_ICON_CHECK_CIRCLE',
  'CNGX_ICON_CHEVRONS_LEFT',
  'CNGX_ICON_CHEVRONS_RIGHT',
  'CNGX_ICON_CHEVRON_DOWN',
  'CNGX_ICON_CHEVRON_LEFT',
  'CNGX_ICON_CHEVRON_RIGHT',
  'CNGX_ICON_CLIPBOARD',
  'CNGX_ICON_COPY',
  'CNGX_ICON_CUT',
  'CNGX_ICON_DOT',
  'CNGX_ICON_DOWNLOAD',
  'CNGX_ICON_EXCLAMATION',
  'CNGX_ICON_EXCLAMATION_SOLID',
  'CNGX_ICON_GRIP_VERTICAL',
  'CNGX_ICON_INFO',
  'CNGX_ICON_INFO_CIRCLE',
  'CNGX_ICON_MAXIMIZE',
  'CNGX_ICON_MENU',
  'CNGX_ICON_MINUS',
  'CNGX_ICON_MORE_HORIZONTAL',
  'CNGX_ICON_MORE_VERTICAL',
  'CNGX_ICON_PENCIL',
  'CNGX_ICON_PLUS',
  'CNGX_ICON_REDO',
  'CNGX_ICON_SEARCH',
  'CNGX_ICON_STOP',
  'CNGX_ICON_TRASH',
  'CNGX_ICON_TRIANGLE_DOWN',
  'CNGX_ICON_TRIANGLE_UP',
  'CNGX_ICON_UNDO',
  'CNGX_ICON_VOLUME',
  'CNGX_ICON_X',
  'CNGX_ICON_ZOOM_IN',
  'CNGX_ICON_ZOOM_OUT',
] as const;

// Glyphs with a signed-off 16-grid drawing: the band consumers in the 15 to
// 20px box. Excluded (kept on the 24-grid path, small: null): CARET_DOWN (Q3,
// bridge caret), and CHECK and BAN (1x smoke 2026-11-04 - the user chose the
// 24-grid path for both; the hinted check read as a different icon, the hinted
// ban rang a touch too thick). MENU is the panel-trigger default and still
// waits for the joint 1x sign-off on the sheet.
const SMALL_ICONS = [
  'CNGX_ICON_ALERT',
  'CNGX_ICON_CHEVRON_RIGHT',
  'CNGX_ICON_MENU',
  'CNGX_ICON_MINUS',
  'CNGX_ICON_STOP',
  'CNGX_ICON_VOLUME',
  'CNGX_ICON_X',
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

// Solid silhouettes with rounded corners (ALERT) or a ring crossed by a slash
// (BAN) have curve end points that are not whole units; only their cut-out
// marks sit on the grid. The three magnifiers share a lens centred on 5.5,
// because a 1-unit plus or minus only centres in a hole of odd width. These
// are checked against the 12 box instead.
const CURVED_MICRO: ReadonlySet<string> = new Set([
  'CNGX_ICON_ALERT',
  'CNGX_ICON_BAN',
  'CNGX_ICON_SEARCH',
  'CNGX_ICON_ZOOM_IN',
  'CNGX_ICON_ZOOM_OUT',
]);

/**
 * Every reason a `d` leaves its grid. Absolute commands only, so a coordinate
 * in the string is the coordinate on the grid; every number is a whole unit
 * except the arc radii, which may end in `.5`. `box` is the grid size (12 for
 * the micro tier, 16 for the small tier).
 */
function gridViolations(d: string, box: number, curved = false): string[] {
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
        const inBox = arg >= 0 && arg <= box;
        const wholeUnit = radius ? Number.isInteger(arg * 2) : Number.isInteger(arg);
        const onGrid = curved ? inBox : wholeUnit;
        if (!onGrid) {
          violations.push(`${command} ${arg} off the grid`);
        }
      });
      index += arity;
    } while (index < tokens.length && !/[A-Za-z]/.test(tokens[index]));
  }
  return violations;
}

const microGridViolations = (d: string, curved = false): string[] => gridViolations(d, 12, curved);
const smallGridViolations = (d: string, curved = false): string[] => gridViolations(d, 16, curved);

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
        'CNGX_ICON_MENU',
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
      const problems = microGridViolations(icon.micro.d, CURVED_MICRO.has(name));
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
    expect(entries.find(([entry]) => entry === name)?.[1].micro).toEqual(
      expect.objectContaining({ viewBox: '0 0 12 12' }),
    );
  });

  // The type requires the field; this catches a cast or a spread that drops it.
  it.each(entries)('%s records a micro decision', (_, icon) => {
    expect(icon.micro).not.toBeUndefined();
  });

  it('keeps every small drawing on the 16 grid', () => {
    const offGrid = entries.flatMap(([name, icon]) => {
      if (!icon.small) {
        return [];
      }
      const problems = smallGridViolations(icon.small.d, CURVED_MICRO.has(name));
      if (icon.small.viewBox !== '0 0 16 16') {
        problems.push(`viewBox ${icon.small.viewBox}`);
      }
      if (!/^M[\d.\s,-]/.test(icon.small.d)) {
        problems.push('does not start with a moveto');
      }
      if (!/^[MmLlHhVvCcSsQqTtAaZz\d.\s,-]+$/.test(icon.small.d)) {
        problems.push('leaves the path grammar');
      }
      return problems.map((problem) => `${name}: ${problem}`);
    });
    expect(offGrid).toEqual([]);
  });

  // The type requires the field; this catches a cast or a spread that drops it.
  it.each(entries)('%s records a small decision', (_, icon) => {
    expect(icon.small).not.toBeUndefined();
  });

  it.each(SMALL_ICONS)('%s carries a small drawing', (name) => {
    expect(entries.find(([entry]) => entry === name)?.[1].small).toEqual(
      expect.objectContaining({ viewBox: '0 0 16 16' }),
    );
  });

  // Exactly the signed-off band glyphs carry a 16-grid drawing; every other icon
  // keeps small: null (CARET_DOWN among them, per Q3). The list is pinned.
  it('draws the small tier only on the signed-off band glyphs', () => {
    const withSmall = entries.filter(([, icon]) => icon.small !== null).map(([name]) => name);
    expect(withSmall.sort()).toEqual([...SMALL_ICONS].sort());
  });

  // No 12-grid drawing of these read well on the sign-off sheet (the circled X
  // loses its cross at 12px, the question mark never survived the grid), so they
  // keep the 24-grid path at every size. The list is exactly the signed-off one.
  it('keeps the 24-grid path only on the signed-off icons', () => {
    const withoutMicro = entries.filter(([, icon]) => icon.micro === null).map(([name]) => name);
    expect(withoutMicro.sort()).toEqual(['CNGX_ICON_QUESTION', 'CNGX_ICON_X_CIRCLE']);
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

  it('accepts fractional curve points inside the box when curved, and rejects strays', () => {
    expect(microGridViolations('M6.514 1.857Q6 1 6.514 1.857Z', true)).toEqual([]);
    expect(microGridViolations('M6.514 13.5Q6 1 6.514 1.857Z', true)).toEqual(['M 13.5 off the grid']);
  });

  it('rejects relative commands', () => {
    expect(microGridViolations('M5 1h2Z')).toEqual(['unsupported command h']);
  });

  it('rejects a command with missing arguments', () => {
    expect(microGridViolations('M5 1L7')).toEqual(['L needs 2 numbers']);
  });

  it('admits a coordinate on the 16 grid that the 12 grid rejects when curved', () => {
    expect(smallGridViolations('M14 2L2 2Z', true)).toEqual([]);
    expect(microGridViolations('M14 2L2 2Z', true)).toEqual(['M 14 off the grid']);
  });
});
