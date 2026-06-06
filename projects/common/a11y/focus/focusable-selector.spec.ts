import { describe, expect, it } from 'vitest';

import { CNGX_FOCUSABLE_SELECTOR } from './focus-restore.directive';

/**
 * Locks {@link CNGX_FOCUSABLE_SELECTOR} against drift. `CngxFocusRestore`
 * matches its element-level `isFocusable` predicate against this same
 * selector (`el.matches(CNGX_FOCUSABLE_SELECTOR)`), and descendant probes
 * query against it - so the selector is the single source of truth for
 * "is this focusable". These cases pin the accepted / rejected sets.
 */
describe('CNGX_FOCUSABLE_SELECTOR', () => {
  function matches(html: string): boolean {
    const host = document.createElement('div');
    host.innerHTML = html;
    const el = host.firstElementChild as HTMLElement;
    return el.matches(CNGX_FOCUSABLE_SELECTOR);
  }

  it('matches natively-focusable form controls and links with href', () => {
    expect(matches('<button>x</button>')).toBe(true);
    expect(matches('<input />')).toBe(true);
    expect(matches('<select></select>')).toBe(true);
    expect(matches('<textarea></textarea>')).toBe(true);
    expect(matches('<a href="#">x</a>')).toBe(true);
  });

  it('matches elements with an explicit non-negative tabindex', () => {
    expect(matches('<div tabindex="0">x</div>')).toBe(true);
    expect(matches('<span tabindex="2">x</span>')).toBe(true);
  });

  it('rejects non-focusable elements', () => {
    expect(matches('<a>no href</a>')).toBe(false);
    expect(matches('<div>x</div>')).toBe(false);
    expect(matches('<span>x</span>')).toBe(false);
  });

  it('rejects elements explicitly removed from the tab order', () => {
    expect(matches('<div tabindex="-1">x</div>')).toBe(false);
    expect(matches('<button tabindex="-1">x</button>')).toBe(true);
  });
});
