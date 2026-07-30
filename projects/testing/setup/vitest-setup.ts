/**
 * Shared teardown for every library `test` target. Wired in via the
 * `setupFiles` option of `@angular/build:unit-test` in `angular.json`;
 * referenced by path, so it is deliberately not exported from
 * `projects/testing/index.ts`.
 *
 * The builder runs vitest with `isolate: false`
 * (`@angular/build/src/builders/unit-test/runners/vitest/plugins.js`, commented
 * there as aligning with the Karma/Jasmine experience), so every spec file in a
 * project shares one environment. An unrestored `vi.useFakeTimers()` therefore
 * patches `requestAnimationFrame` for every file that runs after it: the next
 * spec awaiting a real frame queues its callback into a clock nobody advances
 * and hangs until vitest's 5s cap. `vi.restoreAllMocks()` undoes neither fake
 * timers nor `vi.stubGlobal` - each needs its own call.
 *
 * The two axes restore at different scopes on purpose:
 *
 * - Timers per test. A spec that installs a fake clock in one test and awaits a
 *   real frame in the next fails exactly like the cross-file case.
 * - Globals per file. Several specs stub a global once at module level and rely
 *   on it for every test in the file; a per-test unstub would pull it out from
 *   under them. File scope still closes the leak that matters, since
 *   `isolate: false` is what carries a stub into the next file.
 *
 * Spies are the third axis and are deliberately not restored here. Clearing
 * every `vi.spyOn` after every test would change behaviour for the whole suite
 * rather than close a leak, so a spec that spies on a global object restores it
 * itself; `projects/common/dialog/dialog/dialog.directive.spec.ts` is the
 * reference.
 *
 * A spec needing more teardown than this does it itself. File-local hooks run
 * first - vitest's default `sequence.hooks: 'stack'` runs "after" hooks in
 * reverse registration order - so a teardown that still needs the fake clock or
 * the stub in place keeps it.
 */
import { afterAll, afterEach, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
});

afterAll(() => {
  vi.unstubAllGlobals();
});
