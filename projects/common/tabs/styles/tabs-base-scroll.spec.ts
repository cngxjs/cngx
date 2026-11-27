import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Scroll guard for the tab strip. The strip is a clip box, not a
 * user-scrollable container: only the programmatic `scrollIntoView` of the
 * active tab scrolls it. Snap points there have no user scroll to shape, but
 * WebKit re-snaps to them when the strip relayouts during that smooth scroll,
 * which strands the active tab off-screen. jsdom renders no layout, so this
 * pins the rule statically off the raw CSS.
 */

const BASE_CSS = readFileSync(resolve(__dirname, 'tabs-base.css'), 'utf8');

describe('tab strip scrolling (tabs-base.css)', () => {
  it('declares no scroll-snap on the non-scrollable strip or its tabs', () => {
    expect(BASE_CSS).not.toMatch(/scroll-snap/);
  });
});
