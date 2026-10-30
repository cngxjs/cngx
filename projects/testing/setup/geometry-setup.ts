/**
 * Teardown for the `test-geometry` targets only, wired in after
 * `vitest-setup.ts` through `setupFiles` in `angular.json`. It drives the real
 * pointer through `vitest/browser`, which the jsdom `test` targets do not have,
 * so it cannot live in the shared setup file.
 *
 * A spec that hovers leaves the pointer where it was, and with `isolate: false`
 * the next spec on the page mounts under it and reads `:hover` paint. Parking
 * the pointer after every test keeps a computed-style read independent of run
 * order.
 */
import { afterEach } from 'vitest';

import { parkPointer } from '../geometry/pointer';

afterEach(parkPointer);
