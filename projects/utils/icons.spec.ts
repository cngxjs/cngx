import { describe, expect, it } from 'vitest';

import * as icons from './icons';
import type { CngxIconData } from './icons';

const entries = Object.entries(icons).filter(([name]) => name.startsWith('CNGX_ICON_')) as [
  string,
  CngxIconData,
][];

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

  it('draws the ban slash from top-left to bottom-right', () => {
    expect(icons.CNGX_ICON_BAN.d).toContain('M5.3 5.3l13.4 13.4');
  });

  it('keeps refused and failed visually distinct', () => {
    expect(icons.CNGX_ICON_BAN.d).not.toBe(icons.CNGX_ICON_ALERT.d);
  });
});
