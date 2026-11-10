import { afterEach, vi } from 'vitest';

import { KINDS, cleanupRoots } from './__test-helpers/review-probe-host';
import { describeOpenOnFocusClick } from './__test-helpers/open-on-focus';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

// project-openon-focus-click-toggle: focus opens, the click that follows must
// not toggle the panel back closed.
for (const key of ['select', 'multi', 'reorder', 'tree', 'shell'] as const) {
  describeOpenOnFocusClick(KINDS[key]);
}
