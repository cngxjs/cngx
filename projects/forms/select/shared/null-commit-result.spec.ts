import { afterEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { KINDS, cleanupRoots, log, mount, summarize, tick } from './__test-helpers/review-probe-host';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

/**
 * Runs `fn` with vitest's own `uncaughtException` listeners detached, so the
 * async TypeError the base code rethrows through rxjs `reportUnhandledError`
 * (a `setTimeout(throw)`) is captured here instead of failing the whole file.
 * The captured errors are what the OD1 assertion checks for - the fix removes
 * them, the spec goes green, and this window becomes a no-op.
 */
async function captureUncaught(fn: () => Promise<void> | void): Promise<unknown[]> {
  const caught: unknown[] = [];
  const prevUncaught = process.listeners('uncaughtException');
  const prevRejection = process.listeners('unhandledRejection');
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
  process.on('uncaughtException', (e) => caught.push(e));
  process.on('unhandledRejection', (e) => caught.push(e));
  try {
    await fn();
  } finally {
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
    for (const l of prevUncaught) process.on('uncaughtException', l);
    for (const l of prevRejection) process.on('unhandledRejection', l);
  }
  return caught;
}

/**
 * P5 (review 2026-11-03, A1 / H1 blocker, A2). A `commitAction` that resolves
 * `null` - HttpClient 204 - must mean "no result, keep the intended value", not
 * "clear". Every case fails on base: a pick clears the scalar to `null` or leaves
 * the multi toggle spinner stuck (and a `Promise null` throws an unhandled
 * TypeError), a clear never emits `cleared`. OD1 in Phase 2 flips them green.
 */
describe('P5 commitAction resolves null (HttpClient 204)', () => {
  for (const key of ['select', 'typeahead', 'actionSelect', 'shell', 'multi', 'combobox', 'actionMulti', 'tree', 'reorder']) {
    for (const shape of ['of(null)', 'Promise null'] as const) {
      for (const op of ['pick', 'clear'] as const) {
        it(`${key} ${shape} ${op}`, async () => {
          const kind = KINDS[key];
          const nullAction = () => (shape === 'of(null)' ? of(null) : Promise.resolve(null));
          const initial = op === 'clear' ? (kind.model === 'value' ? 'red' : ['red']) : undefined;
          const m = mount(kind, { initial, commit: nullAction });
          const unhandled = await captureUncaught(async () => {
            if (op === 'pick') m.pickAt(1); else m.clear();
            await tick(3);
            m.settle();
          });
          const s = summarize(m);
          const names = m.events.map((e) => e.name);
          const spokenMsgs = m.spoken.map((x) => x.message.replace(/[⁨⁩]/g, ''));
          log(`P5 ${kind.name} ${shape} ${op} | model=${JSON.stringify(s['model'])} toggling=${s['toggling']} unhandled=${unhandled.length} events=${names.join(',')} spoken=${JSON.stringify(spokenMsgs)}`);

          // OD1: a null result never surfaces as an unhandled error.
          expect(unhandled.length).toBe(0);
          expect(m.errors.length).toBe(0);
          // The optimistic toggle spinner is released.
          expect(s['toggling']).toBeNull();

          if (op === 'pick') {
            if (kind.model === 'value') {
              expect(m.readModel()).toBe('green');
            } else {
              expect(m.readModel()).toContain('green');
            }
            expect(names).toContain('selectionChange');
            if (key === 'multi' || key === 'combobox' || key === 'actionMulti') {
              expect(names).toContain('optionToggled');
            }
            // A pick is not a clear: it never speaks the clear copy.
            expect(spokenMsgs.some((msg) => /cleared/i.test(msg))).toBe(false);
          } else {
            if (kind.model === 'value') {
              expect(m.readModel() == null).toBe(true);
            } else {
              expect(m.readModel()).toEqual([]);
            }
            // A2: a clear resolving null finalizes as a clear. CngxSelect and
            // CngxSelectShell carry no `cleared` output - a single-select clear
            // is a selection change to no value - so they signal it through
            // `selectionChange`; the seven multi-capable composites emit `cleared`.
            if (key === 'select' || key === 'shell') {
              expect(names).toContain('selectionChange');
            } else {
              expect(names).toContain('cleared');
            }
            expect(spokenMsgs.some((msg) => /cleared/i.test(msg))).toBe(true);
            expect(spokenMsgs.some((msg) => /added/i.test(msg))).toBe(false);
          }
        });
      }
    }
  }
});
