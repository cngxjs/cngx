import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Scroll guard for the tab strip. The strip is a clip box, not a
 * user-scrollable container: only the programmatic `scrollIntoView` of the
 * active tab scrolls it. Snap points there have no user scroll to shape, but
 * WebKit re-snaps to them when the strip relayouts during that smooth scroll,
 * which strands the active tab off-screen. jsdom renders no layout, so this
 * pins the rule statically off the raw CSS of both strip stylesheets.
 */

/** Every stylesheet that styles the strip: the structural base and the ui skin. */
const STRIP_STYLESHEETS: ReadonlyArray<readonly [string, string]> = [
  ['tabs-base.css', resolve(__dirname, 'tabs-base.css')],
  ['tab-group.component.css', resolve(__dirname, '../../../ui/tabs/tab-group.component.css')],
];

describe('tab strip scrolling', () => {
  it.each(STRIP_STYLESHEETS)('%s declares no scroll-snap on the strip or its tabs', (_, path) => {
    expect(readFileSync(path, 'utf8')).not.toMatch(/scroll-snap/);
  });
});
